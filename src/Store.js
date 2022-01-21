import React from 'react';

import { Context, StoreUnmountedError } from './context.js';
import { getTag, chain, assign } from './util.js';
import { validateInitialState, setter, dispatcher, validateStateChange } from './accessors.js';

export const storeProp = Symbol('store');
export const reactSetState = Symbol('setState');

export class Store extends React.Component {
  constructor(props, context) {
    super(props);

    const store = this[storeProp] = {
      tag: this.tag = 'tag' in props ? String(props.tag) : getTag('Store'),
      parent: context.store,
      actions: 'actions' in props ? props.actions : null,
      defer: this.defer.bind(this),
      setState: this.setStoreState.bind(this),
      getSingleValueSetter: key => value => setter({ store, single: true }, key, value),
      set: (...args) => setter({ store }, ...args),
      dispatch: (action, ...payload) => dispatcher({ store, action, payload }),
    };

    store.data = chain(store, 'data', props.data);

    let { initialState } = props;

    if (typeof initialState === 'function') {
      // At this point we have parent data + own data and parent state only.
      // State initializer is supposed to be a pure function so we do not
      // provide a way to set state values or dispatch events.
      initialState = initialState({
        data: store.data,
        state: context.store.state,
      });
    }

    // TODO Change this to use options
    validateInitialState(initialState, store);

    // And finally we can populate the full state object
    store.state = chain(store, 'state', initialState);

    // Read only API is just data and state; the same a with full API this is
    // an optimization to minimize garbage collection load.
    store.readonlyAPI = Object.freeze({
      data: store.data,
      state: store.state,
    });

    // This object is for public consumption, it implements the full API
    // that we provide to Store consumers: data, state, set, & dispatch.
    // We keep a reference to full API in the internal store object
    // so that we could use it in context consumer child functions directly
    // without having to recreate it every time.
    // We also expose the public store as well as set() and dispatch() on the
    // Store component instance, mostly for testing purposes.
    this.store = store.fullAPI = Object.freeze({
      data: this.data = store.data,
      state: this.state = store.state,
      set: this.set = store.set,
      dispatch: this.dispatch = store.dispatch,
    });

    // If someone accidentally calls instance.setState() on the Store
    // that would completely bork the state integrity. Replacing
    // the prototype method with our own guarantees that this cannot happen.
    this[reactSetState] = this.setState;

    // TODO This will only handle shortcut setState() invocation,
    // passing an object with new state values. We might want to
    // check for other argument forms and, if not handle them,
    // to throw an exception because ideally setState() should not
    // be used on a Store. Or should it?
    this.setState = store.set;

    this.timerMap = new Map();
  }

  componentWillUnmount() {
    // Two flags because we will null the internal store reference next;
    // pending setters will access the flag on the Store component instance,
    // and the flag on the internal store is needed to throw an exception
    // when userland code tries to read from it.
    this.unmounted = this[storeProp].unmounted = true;

    // Cancel pending action handler invocations
    for (const timer of this.timerMap.values()) {
      clearTimeout(timer);
    }

    this.timerMap.clear();
    this.timerMap = this.defer = this[storeProp] = this.store = this.set = this.dispatch = null;
  }

  componentDidUpdate() {
    if (typeof this.props.onStateChange === 'function') {
      this.props.onStateChange(this[storeProp].readonlyAPI);
    }
  }

  applyReducer(state, values) {
    if (typeof this.props.controlStateChange === 'function') {
      const change = this.props.controlStateChange({ ...state, ...values }, this[storeProp].readonlyAPI);

      values = validateStateChange(state, values, change, this.tag);
    }

    return values;
  }

  setStoreState(values) {
    if (this.unmounted) {
      // At this point we are still in synchronous code path so throwing directly
      // is ok, the calling code should be able to catch it.
      throw new StoreUnmountedError(`Cannot set state values on unmounted Store "${this.tag}"`);
    }

    return new Promise((resolve, reject) => {
      this[reactSetState](
        state => {
          try {
            values = this.applyReducer(state, values);

            // We need to assign new state values before the component state update
            // actually happens because this will trigger a Store render, which in turn
            // will render Store children, and these children want to see the updated
            // state when they are rendered. We cannot do this assignment in a lifecycle
            // method like componentDidUpdate() because it comes _after_ rendering and
            // at that point it's too late.
            assign(this[storeProp], 'state', values, false, true);
          }
          catch (e) {
            reject(e);
          }
          
          return values;
        },
        () => { resolve(this[storeProp].fullAPI); }
      );
    });
  }

  execute(fn, store, args, resolve, reject) {
    const ok = result => resolve(result);

    const nok = error => {
      // This error is thrown when owner Store (or its parent) has been unmounted.
      // Check unmountedness explicitly in case the error is something different
      // but the Store is still being unmounted.
      if (!(error instanceof StoreUnmountedError) && !store.unmounted) {
        // We need to reject the Promise returned from dispatch
        // call; it makes sense to assume that the code calling it
        // is able (and should) handle exceptions. Note that we need to
        // reject it explicitly here instead of, say, in a forceUpdate()
        // callback; this is because when we rethrow this exception in
        // render() the next time it is called, the Store component
        // is considered completely gestankenflopt and forceUpdate()
        // never fires the callback.
        reject(error);

        // We can't use state for error handling since Store state is exposed
        // directly to userland and there is a potential for unforeseen consequences
        // even if we're using a Symbol for internal error key; hence simply set
        // a property on the instance and call forceUpdate to make sure a render
        // is scheduled.
        this.error = error;
        this.forceUpdate();
      }
      else {
        // This part is reached when either this Store or its parent up the chain
        // is unmounted. Next render will never happen so the only thing left is to
        // reject the Promise.
        reject(error);
      }
    };

    try {
      const result = fn(store.fullAPI, ...args);

      if (result instanceof Promise) {
        return result.then(ok).catch(nok);
      }

      ok(result);
    }
    catch (error) {
      nok(error);
    }
  }

  defer(fn, store, ...args) {
    let timer = this.timerMap.get(fn),
      promise;

    if (timer) {
      clearTimeout(timer);
      this.timerMap.delete(fn);
    }

    promise = new Promise((resolve, reject) => {
      timer = setTimeout(() => { this.execute(fn, store, args, resolve, reject) }, 0);
    });

    this.timerMap.set(fn, timer);

    return promise;
  }

  render() {
    // If an error was thrown and caught in an action handler, we need to rethrow it
    // so that it would be caught by a parent ErrorBoundary.
    if (this.error) {
      throw this.error;
    }

    // Make sure data is always up to date. This cannot be reliably done elsewhere
    // since there are multiple scenarios where other lifecycle methods are skipped
    // and only render() is called. This operation is cheap so no need for conditionals.
    assign(this[storeProp], 'data', this.props.data, true);

    if (typeof this.props.children === 'function' && !React.isValidElement(this.props.children)) {
      return React.createElement(
        Context.Provider,
        { value: { store: this[storeProp] } },
        React.createElement(Context.Consumer, null, ({ store }) => this.props.children(store.fullAPI))
      );
    }

    return React.createElement(
      Context.Provider, { value: { store: this[storeProp] } }, this.props.children
    );
  }
}

Store.contextType = Context;
Store.defaultProps = {
  data: {},
  initialState: {},
};
