import React from 'react';

import { Context, rootViewController, ViewModelUnmountedError } from './context.js';
import { accessorType } from './accessors.js';
import { getId, findOwner, defer as doDefer } from './util.js';

export const exceptionificate = (fn, vm) => {
    const exceptionificatedFn = (...args) => {
        if (!vm.unmounted) {
            return fn(...args);
        }

        const type = fn[accessorType];

        throw new ViewModelUnmountedError(
            `Cannot call ${type} function on ViewModel "${vm.id}", it is unmounted`
        );
    };

    exceptionificatedFn[accessorType] = fn[accessorType];

    return exceptionificatedFn;
};

// The purpose of this function is to expose an API while decoupling
// from the actual ViewController context object.
export const expose = ({ vm, $get, $set, $dispatch }) => ({
    $get: exceptionificate($get || vm.$get, vm),
    $set: exceptionificate($set || vm.$set, vm),
    $dispatch: exceptionificate($dispatch, vm),
});

export const invalidSet = () => {
    throw new Error("Setting key values is not supported in unmount handler");
};

export const invalidDispatch = () => {
    throw new Error("Dispatching events is not supported in unmount handler");
};

const dispatcher = ({ vc, protectedKey, event, payload }) => {
    const [owner] = findOwner(vc, 'handlers', event);
    const handler = owner && owner.handlers[event];
    
    if (typeof handler === 'function') {
        // If the event is a protected key event, we need to massage
        // the setter function passed into the handler, so that trying
        // to $set(protectedKey, value) from within that handler
        // wouldn't dispatch another event.
        // In other words, within a protected key event handler, it is
        // possible to set *only* that key directly, while any other keys
        // are going to to through the usual routine.
        if (protectedKey) {
            vc = {
                ...vc,
                $set: (...args) => vc.vm.$protectedSet(protectedKey, ...args),
            };
            
            vc.$set[accessorType] = 'protectedSet';
        }
        
        return vc.defer(handler, vc, true, ...payload);
    }
    else {
        return rootViewController.$dispatch(event, ...payload);
    }
};

const accessorizeViewController = vc => {
    vc.$dispatch = (event, ...payload) => dispatcher({ vc, event, payload });
    vc.$dispatch[accessorType] = 'dispatch';
    
    vc.$protectedDispatch = (protectedKey, event, ...payload) =>
        dispatcher({ vc, protectedKey, event, payload });
    
    vc.$protectedDispatch[accessorType] = 'dispatch';
    
    return vc;
};

export class ViewController extends React.Component {
    constructor(props) {
        super(props);
        
        this.id = 'id' in props      ? props.id
                : 'ownerId' in props ? `${props.ownerId}-controller`
                :                      getId('ViewController')
                ;
        
        this.timerMap = new Map();
        this.defer = this.defer.bind(this);
        this.runRenderHandlers = this.runRenderHandlers.bind(this);

        this.state = { error: null };
    }
    
    componentWillUnmount() {
        const { unmount } = this.props;

        for (const timer of this.timerMap.values()) {
            clearTimeout(timer);
        }
        
        this.timerMap.clear();

        // eslint-disable-next-line react/no-direct-mutation-state
        this.timerMap = this.defer = this.runRenderHandlers = this.state = null;

        if (typeof unmount === 'function') {
            // We do not allow dispatching events or setting key values
            // in the unmount handler. It's read only.
            // This is because unmount handler is executed *synchronously*,
            // and anything writeable might lead to inconsistent state.
            // Considering that the purpose of the unmount handler is to
            // provide a way to clean up external resources, this makes
            // total sense (well, at least presently).
            unmount({
                $get: this.$get,
                $set: invalidSet,
                $dispatch: invalidDispatch,
            });
        }
    }

    execute(fn, vc, args, resolve, reject) {
        const ok = result => resolve && resolve(result);

        const nok = error => {
            // This error is thrown when upstream ViewModel has been unmounted.
            // When that happens, this controller instance is either already
            // unmounted, or will be unmounted very soon, and next rendering
            // will never happen.
            if (!(error instanceof ViewModelUnmountedError)) {
                this.setState({ error });
            }

            // We need to reject the Promise returned from $dispatch
            // call; it makes sense to assume that the code calling it
            // is able (and should) handle exceptions.
            if (reject) {
                reject(error);
            }
        };

        try {
            const result = fn(expose(vc), ...args);

            if (result instanceof Promise) {
                return result.then(ok).catch(nok);
            }
            
            ok(result);
        }
        catch (error) {
            nok(error);
        }
    }

    defer(fn, vc, wantPromise, ...args) {
        let timer = this.timerMap.get(fn),
            promise;
        
        if (timer) {
            clearTimeout(timer);
            this.timerMap.delete(fn);
        }

        if (wantPromise) {
            promise = new Promise((resolve, reject) => {
                timer = doDefer(() => {
                    this.execute(fn, vc, args, resolve, reject);
                });
            });
        }
        else {
            timer = doDefer(() => { this.execute(fn, vc, args); });
        }

        this.timerMap.set(fn, timer);

        return promise;
    }

    runRenderHandlers(vc, props) {
        const me = this;
        
        const { initialize, invalidate } = props;
        
        if (!me.$initialized) {
            if (typeof initialize === 'function') {
                const initializeWrapper = me.$initializeWrapper ||
                    (me.$initializeWrapper = (...args) => {
                        // Initializer function is possibly making changes
                        // to the parent ViewModel state, which might cause
                        // extra rendering of this ViewController.
                        // To avoid extraneous invocations of the initializer
                        // function, clear the flags before invoking it.
                        me.$initialized = true;
                        delete me.$initializeWrapper;
                        
                        return initialize(...args);
                    });
                
                // We have to defer executing the function because setting state
                // is prohibited during rendering cycle.
                me.defer(initializeWrapper, vc);
            }
            else {
                me.$initialized = true;
            }
        }
        else {
            // Same as `initialize`, we need to run `invalidate`
            // out of event loop.
            if (typeof invalidate === 'function') {
                me.defer(invalidate, vc);
            }
        }
    }
    
    render() {
        const { error } = this.state;

        if (error) {
            throw error;
        }

        const me = this;
        
        const {
            id, $viewModel, $viewModelInstance, parentVc, handlers, children
        } = me.props;
        
        const innerVC = ({ vm, vc: parentVc }) => {
            const vc = accessorizeViewController({
                id: id || me.id,
                parent: parentVc,
                vm,
                handlers,
                defer: me.defer,
            });
            
            // ViewModel needs dispatcher reference to fire events
            // for corresponding protected keys.
            vm.$dispatch = vc.$dispatch;
            vm.$protectedDispatch = vc.$protectedDispatch;

            // ViewModel instance needs to expose $dispatch
            if ($viewModelInstance) {
                $viewModelInstance.$dispatch = vc.$dispatch;
            }

            // ViewController needs $get to fire unmount event.
            // Note that this.$get reference is *only* used for that case,
            // and as the result is not exceptionificated to allow reading
            // from parent ViewModel even if it is unmounted. Since the
            // `unmount` event is intended for resource clean-up, not allowing
            // to read from the parent ViewModel would sort of defeat the purpose.
            me.$get = vm.$get;
            
            // We *need* to run initialize and invalidate handlers during rendering,
            // as opposed to a lifecycle method such as `componentDidMount`.
            // The purpose of these functions is to do something that might affect
            // parent ViewModel state, and we need to have the `vm` ViewModel
            // object reference to be able to do that. `vm` comes either from
            // ViewModelContext, or directly injected by parent ViewModel,
            // but in each case that happens during rendering cycle,
            // not before or after.
            me.runRenderHandlers(vc, me.props);
            
            return (
                <Context.Provider value={{ vm, vc }}>
                    { children }
                </Context.Provider>
            );
        };
    
        return $viewModel
            ? innerVC({ vm: $viewModel, vc: parentVc })
            : <Context.Consumer>
                { innerVC }
              </Context.Consumer>;
    }
}
