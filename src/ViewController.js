import React from 'react';

import { Context, rootViewController } from './context';
import { accessorType } from './accessors';
import { getId, findOwner, defer as doDefer } from './util';

// The purpose of this function is to expose an API while decoupling from the actual
// ViewController context object.
export const expose = ({ vm, $get, $set, $dispatch }) => ({
    $get: $get || vm.$get,
    $set: $set || vm.$set,
    $dispatch,
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
        
        return vc.deferDispatch(handler, vc, ...payload);
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
        this.deferDispatch = this.deferDispatch.bind(this);
        this.deferHandler = this.deferHandler.bind(this);
        this.runRenderHandlers = this.runRenderHandlers.bind(this);

        this.state = { error: null };
    }
    
    componentWillUnmount() {
        const { unmount } = this.props;

        if (typeof unmount === 'function') {
            // We do not allow dispatching events or setting key values
            // in the unmount handler. It's read only.
            // This is because unmount handler is executed *synchronously*,
            // and anything writeable might lead to inconsistent state.
            // Considering that the purpose of the unmount handler is to
            // provide a way to clean up external resources, this makes
            // total sense (well, at this moment).
            unmount({
                $get: this.$get,
                $set: invalidSet,
                $dispatch: invalidDispatch,
            });
        }

        for (const timer of this.timerMap.values()) {
            clearTimeout(timer);
        }
        
        this.timerMap.clear();
    }

    deferHandler(fn, vc, ...args) {
        let timer = this.timerMap.get(fn);
        
        if (timer) {
            clearTimeout(timer);
            this.timerMap.delete(fn);
        }
        
        timer = doDefer(() => {
            const nok = error => {
                this.setState({ error });
            };

            try {
                const result = fn(expose(vc), ...args);

                if (result instanceof Promise) {
                    return result.catch(nok);
                }
            }
            catch (error) {
                nok(error);
            }
        });

        this.timerMap.set(fn, timer);
    }
    
    deferDispatch(fn, vc, ...args) {
        let timer = this.timerMap.get(fn);
        
        if (timer) {
            clearTimeout(timer);
            this.timerMap.delete(fn);
        }
        
        const promise = new Promise((resolve, reject) => {
            timer = doDefer(() => {
                const ok = result => resolve(result);

                const nok = error => {
                    this.setState({ error });

                    // We need to reject the Promise returned from $dispatch
                    // call; it makes sense to assume that the code calling it
                    // is able (and should) handle exceptions.
                    reject(error);
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
            });
        });
        
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
                        
                        initialize(...args);
                    });
                
                // We have to defer executing the function because setting state
                // is prohibited during rendering cycle.
                me.deferHandler(initializeWrapper, vc);
            }
            else {
                me.$initialized = true;
            }
        }
        else {
            // Same as `initialize`, we need to run `invalidate`
            // out of event loop.
            if (typeof invalidate === 'function') {
                me.deferHandler(invalidate, vc);
            }
        }
    }
    
    render() {
        const { error } = this.state;

        if (error) {
            throw error;
        }

        const me = this;
        
        const { id, $viewModel, parentVc, handlers, children } = me.props;
        
        const innerVC = ({ vm, vc: parentVc }) => {
            const vc = accessorizeViewController({
                id: id || me.id,
                parent: parentVc,
                vm,
                handlers,
                deferDispatch: me.deferDispatch,
            });
            
            // ViewModel needs dispatcher reference to fire events
            // for corresponding protected keys.
            vm.$dispatch = vc.$dispatch;
            vm.$protectedDispatch = vc.$protectedDispatch;

            // ViewController needs $get to fire unmount event
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
