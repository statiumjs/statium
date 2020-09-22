import ReactDOM from 'react-dom';
import loGet from 'lodash.get';

import { validKey, getKeys, getKeyPrefix, findOwner } from './util';
import { normalizeBindings, mapProps, mapPropsToArray } from './bindings';

export const accessorType = Symbol('accessorType');

const batch_updates = typeof ReactDOM.unstable_batchedUpdates === 'function'
    ? ReactDOM.unstable_batchedUpdates
    : fn => fn();

const resolveValue = (vm, key) =>
    vm.formulas[key] ? vm.formulas[key](vm.$get) : loGet(vm.store, key);

const getStateKeyOwner = (vm, key) => {
    const prefix = getKeyPrefix(key);
    
    const [owner, depth] = findOwner(vm, 'state', prefix);
    
    // If no owner was found, the key does not exist up the prototype chain.
    // This means we can't set it.
    if (owner === null) {
        throw new Error(
            `Cannot find owner ViewModel for key ${String(key)}. You need to provide ` +
            `initial value for this key in "initialState" prop.`
        );
    }
    
    return [owner, depth];
};

export const multiGet = (vm, keys) => {
    let objectSyntax = false;
    
    if (keys.length === 1) {
        // Trivial case when getter invoked with one string key name, thusly:
        // const foo = $get('foo')
        if (validKey(keys[0])) {
            return vm.$resolveValue(keys[0]);
        }
        else if (typeof keys[0] === 'object') {
            keys = keys[0];
        
            if (!Array.isArray(keys)) {
                objectSyntax = true;
            }
        }
    }
    
    const bindings = normalizeBindings(keys, true);
    
    return objectSyntax ? mapProps(vm, bindings) : mapPropsToArray(vm, bindings);
};

export const multiSet = ({ vm, forceKey, single }, key, value) => {
    // Trivial case for single key, used for bound key setters.
    // `single` flag is to optimize away the `validKey()` call
    // when we know for sure it's only one key and it's valid.
    if (single || validKey(key)) {
        const [owner] = getStateKeyOwner(vm, key);
    
        if (owner.protectedKeys && key in owner.protectedKeys && key !== forceKey) {
            const event = owner.protectedKeys[key];
            
            return owner.$protectedDispatch(key, event, value);
        }
        else {
            return owner.setState({ [key]: value });
        }
    }

    let kv;
    
    if (key && typeof key === 'object' && !Array.isArray(key)) {
        kv = key;
    }
    
    if (!kv) {
        throw new Error(`Invalid arguments: key "${JSON.stringify(key)}", `+
                        `value: "${JSON.stringify(value)}"`);
    }
    
    const ownerMap = new Map();
    
    for (const k of getKeys(kv)) {
        const [owner, depth] = getStateKeyOwner(vm, k);
        
        let o = ownerMap.get(owner);
        
        if (o == null) {
            o = {
                owner,
                depth,
                values: {},
                protectedValues: {},
            };
            
            ownerMap.set(owner, o);
        }
        
        if (owner.protectedKeys && k in owner.protectedKeys && k !== forceKey) {
            o.protectedValues[k] = kv[k];
        }
        else {
            o.values[k] = kv[k];
        }
    }
    
    const sortedQueue = [...ownerMap.values()].sort(
        (a, b) => a.depth < b.depth ? 1 : -1
    );
    
    const promises = [];
    
    batch_updates(() => {
        for (const item of sortedQueue) {
            const { owner, values, protectedValues } = item;
        
            for (const protectedKey of getKeys(protectedValues)) {
                const protectedValue = protectedValues[protectedKey];
                const event = owner.protectedKeys[protectedKey];
            
                promises.push(owner.$protectedDispatch(protectedKey, event, protectedValue));
            }
        
            promises.push(owner.setState(values));
        }
    });
    
    return Promise.all(promises);
};

export const accessorizeViewModel = vm => {
    vm.$resolveValue = key => resolveValue(vm, key);
    vm.$resolveValue[accessorType] = 'resolve';

    vm.$setSingleValue = (key, value) => multiSet({ vm, single: true }, key, value);
    vm.$setSingleValue[accessorType] = 'set';
    
    vm.$get = (...args) => multiGet(vm, args);
    vm.$get[accessorType] = 'get';
    
    vm.$set = (...args) => multiSet({ vm }, ...args);
    vm.$set[accessorType] = 'set';
    
    vm.$protectedSet = (forceKey, ...args) => multiSet({ vm, forceKey }, ...args);
    vm.$protectedSet[accessorType] = 'set';
    
    vm.$dispatch = vm.$dispatch || vm.parent.$dispatch;
    vm.$protectedDispatch = vm.$protectedDispatch || vm.parent.$protectedDispatch;
    
    return vm;
};

export const validateInitialState = (state, vm) => {
    if (state && typeof state === 'object' && !Array.isArray(state)) {
        for (const key of getKeys(state)) {
            if (key in vm.data) {
                const [owner] = findOwner(vm, 'data', key);

                if (owner) {
                    console.warn(`initialState for ViewModel "${vm.id}" ` +
                                    `contains key "${String(key)}" that overrides ` +
                                    `data key with similar name provided by ` +
                                    `ViewModel "${owner.id}".`);
                }
            }

            if (key in vm.parent.state) {
                const [owner] = getStateKeyOwner(vm, key);
                
                if (owner) {
                    console.warn(
                        `initialState for ViewModel "${vm.id}" contains key "${String(key)}" ` +
                        `that overrides another state key with similar name ` +
                        `provided by parent ViewModel "${owner.id}".`
                    );
                }
            }
        }
        
        return true;
    }
    
    throw new Error(`Invalid initialState: ${JSON.stringify(state)}`);
};
