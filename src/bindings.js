import { getKeys, validKey, setterNameForKey } from './util';

const isArrayForm = binding =>
    Array.isArray(binding) && binding.length === 2 && validKey(binding[0]) &&
    typeof binding[1] === 'boolean';

export const normalizeBindings = (bindings = {}, variadic) => {
    if (!bindings || !(typeof bindings === 'object' || validKey(bindings))) {
        throw new Error(`Invalid bindings: ${JSON.stringify(bindings)}`);
    }
    
    // Single binding that comes from variadic arguments needs to be unwrapped, _unless_
    // it is an array binding form, or a single key binding.
    if (variadic && Array.isArray(bindings) && bindings.length === 1 && !validKey(bindings[0]) &&
        !isArrayForm(bindings[0]))
    {
        bindings = bindings[0];
    }
    
    if (validKey(bindings)) {
        bindings = [bindings];
    }
    
    if (Array.isArray(bindings)) {
        bindings = bindings.reduce((map, propName) => {
            if (validKey(propName)) {
                map[propName] = propName;
            }
            else if (Array.isArray(propName)) {
                const [key, publish = false] = propName;
                
                // prop name is the same as key in this case
                map[key] = { key, publish };
            }
            else if (typeof propName === 'object') {
                let { prop, key, publish = false, ...rest } = propName;
                
                if (!validKey(key)) {
                    throw new Error("The 'key' field is required for a binding: " +
                                    JSON.stringify(propName));
                }
                
                prop = validKey(prop) ? prop : key;
                
                map[prop] = { ...rest, key, publish };
            }
            
            return map;
        }, {});
    }
    
    return getKeys(bindings).map(propName => {
        const binding = bindings[propName];
        
        if (validKey(binding)) {
            return { propName, key: binding, publish: false };
        }
        else if (typeof binding === 'function') {
            return { propName, key: propName, formula: binding };
        }
        else if (typeof binding === 'object') {
            let { key, publish, formula, setterName } = binding;
            
            if (formula && typeof formula !== 'function') {
                throw new Error(`Invalid formula definition: ${JSON.stringify(formula)}`);
            }
            
            if ('publish' in binding && typeof publish !== 'boolean') {
                throw new Error(`Invalid publish value: ${JSON.stringify(publish)}. Should be 'true' or 'false'.`);
            }
            
            if (publish && typeof key === 'symbol' && !setterName) {
                throw new Error("Setter function name is required for publishing Symbol " +
                                "keys in a ViewModel. Published key: " + String(key));
            }
            
            return {
                propName,
                key: key || propName,
                publish,
                ...publish ? { setterName: setterName || setterNameForKey(propName) } : {},
                ...formula ? { formula } : {},
            };
        }
        else {
            // TODO Better error handling
            throw new Error('Invalid bound prop definition');
        }
    });
};

export const mapProps = (vm, bindings) =>
    bindings.reduce((out, binding) => {
        const { propName, key, formula, publish, setterName } = binding;
        
        out[propName] = formula ? formula(vm.$retrieve) : vm.$retrieve(key);
        
        if (publish) {
            out[setterName] = vm.getKeySetter(vm, key);
        }
        
        return out;
    }, {});

export const mapPropsToArray = (vm, bindings) =>
    bindings.map(binding => {
        const { key, formula, publish } = binding;
        
        const value = formula ? formula(vm.$retrieve) : vm.$retrieve(key);
        
        if (!publish) {
            return value;
        }
        
        const setter = vm.getKeySetter(vm, key);
        
        return [value, setter];
    });
