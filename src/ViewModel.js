import React from 'react';
import loGet from 'lodash.get';
import loSet from 'lodash.set';
import loHas from 'lodash.has';
import loClone from 'lodash.clone';

import { Context } from './context';
import { getId, chain, getKeys, getKeyPrefix, normalizeProtectedKeys } from './util';
import { validateInitialState, accessorizeViewModel, accessorType } from './accessors';
import { ViewController } from './ViewController';

const dotRe = /\./;

export const applyViewModelState = (currentState, values) => {
    const newState = { ...currentState };
    
    let updated = false;
    
    for (const key of getKeys(values)) {
        const value = values[key];
        
        // Cheaper operation if no deep inspection is necessary.
        if (typeof key === 'symbol' || !dotRe.test(key)) {
            if (!Object.is(currentState[key], value)) {
                newState[key] = value;
                updated = true;
            }
        }
        else {
            const hasKey = loHas(currentState, key);
            const oldValue = loGet(currentState, key);
    
            // All this awkward gymnastics with cloning is to force ViewModel re-render
            // upon value change. 
            // TODO Come up with a better way to solve this problem.
            if (!hasKey || !Object.is(oldValue, value)) {
                const prefix = getKeyPrefix(key);
                const copy = loClone(currentState[prefix]);
            
                newState[prefix] = copy;
                loSet(newState, key, value);
            
                updated = true;
            }
        }
    }
    
    return updated ? newState : currentState;
};

class ViewModelState extends React.Component {
    static getDerivedStateFromProps(props, localState) {
        const { vm, applyState } = props;
        
        if (applyState) {
            const result = applyState(localState, vm.$get);
            
            // If applyState() does not return a value, result will be `undefined`.
            // React complains about this, loudly; returning `null` instead is ok.
            return result == null ? null : result;
        }
        
        return null;
    }
    
    constructor(props) {
        super(props);
        
        this.setViewModelState = this.setViewModelState.bind(this);
        this.getKeySetter = this.getKeySetter.bind(this);
        
        let { initialState, protectedKeys, vm } = props;
        
        if (protectedKeys != null) {
            this.protectedKeys = normalizeProtectedKeys(protectedKeys);
        }
        
        if (typeof initialState === 'function') {
            initialState = initialState(vm.$get);
        }
        
        if (process.env.NODE_ENV !== 'production') {
            validateInitialState(initialState, vm);
        }
        
        this.state = {...initialState};
    }
    
    componentDidUpdate() {
        const { vm, observeStateChange } = this.props;
        
        if (typeof observeStateChange === 'function') {
            observeStateChange(vm.store);
        }
    }
    
    getKeySetter(vm, key) {
        if (!(key in vm.state) && key in vm.data) {
            throw new Error(`Setting read-only key "${String(key)}" is not allowed.`);
        }
        
        const setter = value => vm.$setSingleValue(key, value);
        setter[accessorType] = 'set';
        
        return setter;
    }
    
    setViewModelState(props) {
        const me = this;
        
        return new Promise(resolve => {
            me.setState(
                state => applyViewModelState(state, props),
                () => { resolve(true); }
            );
        });
    }
    
    render() {
        const me = this;
        
        const { vm, vc, children } = me.props;
        
        vm.state = chain(vm.parent.state, me.state);
        vm.store = chain(vm.parent.store, vm.data, me.state);
        
        vm.protectedKeys = me.protectedKeys;
        vm.getKeySetter = me.getKeySetter;
        vm.setState = me.setViewModelState;
        
        const controller = me.props.controller || (me.protectedKeys ? {} : null);
        
        if (controller) {
            return <ViewController {...controller}
                $viewModel={vm}
                parentVc={vc}
                ownerId={vm.id}>
                    { children }
              </ViewController>;
        }

        return <Context.Provider value={{ vm, vc }}>
            { children }
        </Context.Provider>
    }
}

/*
 * Accepted props:
 *  id, data, initialState, formulas, applyState, observeStateChange, controller,
 *  protectedKeys, children
 */
export const ViewModel = props => (
    <Context.Consumer>
        { ({ vm: parentVm, vc }) => {
            const formulas = chain(parentVm.formulas, props.formulas);
            const data = chain(parentVm.data, props.data);
            const state = chain(parentVm.state, {});
            
            // At this point, our store contains only data
            const store = chain(parentVm.store, props.data);
            
            const vm = accessorizeViewModel({
                id: 'id' in props ? props.id : getId('ViewModel'),
                parent: parentVm,
                formulas,
                data,
                state,
                // This property gets overwritten by ViewModelState.render();
                // the purpose of having it here is to provide initial
                // store object for applyState() and initialState()
                store,
            });
            
            return (
                <ViewModelState vm={vm}
                    vc={vc}
                    controller={props.controller}
                    initialState={props.initialState}
                    applyState={props.applyState}
                    observeStateChange={props.observeStateChange}
                    protectedKeys={props.protectedKeys}>
                    { props.children }
                </ViewModelState>
            );
        }}
    </Context.Consumer>
);

ViewModel.defaultProps = {
    data: {},
    initialState: {},
    formulas: {},
    applyState: null,
};
