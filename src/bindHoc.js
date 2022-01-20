import React from 'react';
import { Context, isObject, formatForError } from './context.js';

const resolveSelectors = selectors => store => typeof selectors === 'function'
  ? selectors(store.readonlyAPI)
  // Note Object.keys() here because Symbol props are not supported
  // for React components and we cannot map to them.
  : Object.keys(selectors).reduce((map, key) => {
    const selector = selectors[key];

    if (typeof selector === 'function') {
      map[key] = selector(store.readonlyAPI);
    }
    else if (isObject(selector)) {
      map[key] = resolveSelectors(selector)(store);
    }
    else {
      throw new TypeError(`Invalid selector with key ${key}: ${formatForError(selector)}`);
    }
      
    return map;
  }, {});

const bindSettersAndDispatchers = boundFns => store => 
  // Same as above, we use Object.keys here on purpose.
  Object.keys(boundFns).reduce((map, key) => {
    const fn = boundFns[key];

    if (typeof fn === 'function') {
      map[key] = (...args) => store.dispatch(fn, ...args);
    }
    else if (isObject(fn)) {
      map[key] = bindSettersAndDispatchers(fn)(store);
    }
    else {
      throw new TypeError(`Expected function in key "${key}", got ${formatForError(fn)}`);
    }

    return map;
  }, {});

const isValidSelector = value => typeof value === 'function' || isObject(value);

export const resolvePropsAndDispatchers = (mapProps, mapDispatchers) => store => {
  const props = mapProps ? resolveSelectors(mapProps)(store) : {};
  const dispatchers = bindSettersAndDispatchers(mapDispatchers)(store);

  return { ...props, ...dispatchers };
};

const normalizeMapStoreToProps = (...args) => {
  if (args.length === 0) {
    return store => ({ store: store.fullAPI });
  }

  if (args.length === 1) {
    const arg = args[0];

    if (typeof arg === 'string') {
      return store => ({ [arg]: store.fullAPI });
    }
    else if (isValidSelector(arg)) {
      return resolveSelectors(arg);
    }
    else {
      throw new TypeError(`Invalid bind() argument: ${formatForError(arg)}`);
    }
  }
  else {
    const [mapProps, mapDispatch] = args;

    // We allow mapProps to be null in 2-argument form
    if (mapProps !== null && !isValidSelector(mapProps)) {
      throw new TypeError(`First argument to bind() should be a valid selector function or object`);
    }

    if (!isValidSelector(mapDispatch) || typeof mapDispatch === 'function') {
      throw new TypeError(`Second argument to bind() should be an object with setter/dispatcher function values`);
    }

    return resolvePropsAndDispatchers(mapProps, mapDispatch);
  }
};

export const bind = (...args) => Component => {
  const mapFn = normalizeMapStoreToProps(...args);

  const BoundComponent = ownProps =>
    React.createElement(
      Context.Consumer,
      null,
      ({ store }) => React.createElement(Component, { ...ownProps, ...mapFn(store) })
    );

    BoundComponent.displayName = `bind(${Component.displayName || Component.name})`;

    return BoundComponent;
};
