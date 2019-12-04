import { getKeys, validKey, setterNameForKey } from './util';

/**
 *
 * Convenience function that accepts ViewModel binding definition in various formats,
 * including expanded format for more settings, as well as some shortcut forms, does
 * certain correctness checks, and reduces binding definitions to normalized form
 * that is then used in `mapProps` at value retrieval time.
 *
 * Normalization is done once at consumer component rendering time as opposed to
 * value retrieval time for the following reasons:
 *
 * * It allows simplifying the code that works with binding definitions (`mapProps`),
 * because there is no need for it to check for all possible binding options that might be
 * supported by ViewModel now or in the future.
 *
 * * It allows keeping the code that does correctness checks in one place, which helps
 * with readability and maintainability.
 *
 * * It allows doing correctness checks at the component rendering time, or at component
 * constructor definition time (when used via `withBindings` HOC), as opposed to every time
 * a key/value pair is retrieved from ViewModel store.
 *
 * * It provides for better developer experience by giving an option to define bindings
 * in shortcut forms instead of having to spell out a normalized form each time. This
 * improves code readability.
 *
 * * It is a form of preemptive performance optimization where the cost of correctness
 * checks and supporting various shortcut forms for binding definitions is not incurred
 * each time a key/value pair is retrieved for a consumer component, but instead is incurred
 * only once.
 *
 * @params {Object|Array|String} bindings The binding definitions to normalize. The following
 * forms are supported:
 *
 * - A single string; means that consumer component is bound to a single key in ViewModel store,
 * with the string value being the name of the key to bind to, as well as the name of the
 * prop to inject into consumer component. The binding is assumed to be one-way (read only),
 * with value from ViewModel store being injected into consumer component's props without
 * ability for the component to change the value.
 *
 * Example: `normalizeBindings('foo')` -> bind a component one way to a key named 'foo' in the
 * ViewModel store, and inject the prop named 'foo' with the value from the ViewModel store
 * into consumer component's props at rendering time.
 *
 * - An array of binding definitions. In this case definitions are iterated over
 * and normalized individually. Each element of the array can be a string (see above),
 * or an object with binding options (see Binding options below).
 *
 * Example:
 *
 *      normalizeBindings([
 *          'foo', // Bind to 'foo' key in ViewModel store, inject 'foo' prop, one way
 *          'bar', // -- '' --
 *          { ... } // See below
 *      ])
 * 
 * - An object of binding definitions. In this case the keys of the object are interpreted
 * as *prop* name to be injected into consumer component, and the value of the definition
 * object can be either:
 *
 * 1. A string, in which case it is assumed to be the name of the ViewModel store key
 * to bind to, in one-way mode
 * 2. An object with binding options, see Binding options below.
 *
 * Example:
 *
 *      normalizeBindings({
 *          foo: 'bar',  // Bind consumer component to key 'bar' in ViewModel store,
 *                       // inject the value as prop named 'foo', one way
 *          qux: 'fred', // Bind to key 'fred', inject as prop 'qux', one way
 *          plugh: {
 *              ...      // See Binding options below
 *          }
 *      })
 *
 * Binding options provided via an object allow expanded configuration of a binding.
 * The following options are supported:
 *
 * - `key`: the name of the key in ViewModel store. Key name is the only mandatory option
 * that should be provided. 
 * - `prop`: the name of the prop to inject into consumer component's props at render time,
 * with value retrieved from ViewModel store. If `prop` is omitted, it is assumed to be
 * equal to `key` option.
 * - `publish`: Can be either a Boolean `true`, or a String. In both cases this means to bind
 * two way (read-write), and consumer component will receive a setter function in its props
 * along with the value, similar to React `useState` hook: `[foo, setFoo] = useState(0)`.
 * 
 * When `publish` value is a string, it is interpreted as the key name to update when
 * setter function is called. When `publish` value is a Boolean, it is interpreted as a
 * shortcut to indicate two-way binding, and published key name is assumed to be the same
 * as bound key name (`key` above). The `publish` value of `false` is legal but is
 * meaningless and is not recommended as its meaning is the same as the default
 * (one-way binding).
 *
 * - `setterName`: The name of the prop used to pass the setter function into consumer
 * component props. If not provided, a default setter prop name of `setFoo` is used,
 * where `Foo` is a capitalized name of the published prop (see `publish`). This is
 * sometimes useful for form fields, where the input value might be desired to be passed
 * in the `value` prop, but the setter should be named `onChange` or similar.
 *
 * The setter function needs to be called with a single argument, which is the new value
 * for the ViewModel store key.
 *
 * Example:
 *
 *      {
 *          // Bind go key `blerg` in ViewModel store
 *          key: 'blerg',
 *
 *          // Inject the value in prop named `ghek` into consumer component
 *          prop: 'ghek',
 *
 *          // Bind two-way, equivalent to `publish: 'blerg'`
 *          publish: true,
 *          
 *          // Consumer component will receive setter function in `onChange` prop
 *          setterName: 'onChange', 
 *      }
 *
 *
 * @return {Object[]} Array of normalized bindings in the form of:
 *
 *      [{
 *          key: 'The ViewModel store key to bind to',
 *          propName: 'The prop name to inject',
 *          publish: 'The key name to publish',
 *          setterName: 'Setter function prop name',
 *      }, {
 *          ...
 *      }]
 *
 * Note that this is a *private* function that is not intended to be used outside of
 * this module, and is not a part of the public ViewModel API. It is exported from this
 * module solely for the purpose of unit testing. Private function API is not guaranteed
 * to be stable and might change at any time without notice. This documentation blob
 * covers only input and output of this private function, with brief explanations of
 * ViewModel features, but does not strive to cover public ViewModel API in full.
 *
 * @private
 */
export const normalizeBindings = (bindings = {}) => {
    if (!bindings || !(typeof bindings === 'object' || validKey(bindings))) {
        throw new Error(`Invalid bindings: ${JSON.stringify(bindings)}`);
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
