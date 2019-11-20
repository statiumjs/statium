import React from 'react';
import upperFirst from 'lodash/upperFirst';

export const chain = (proto, props) => Object.assign(Object.create(proto), props);

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
 * constructor definition time (when used via `withBoundProps` HOC), as opposed to every time
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
export const normalizeBindings = bindings => {
    if (typeof bindings === 'string') {
        bindings = [bindings];
    }
    
    if (Array.isArray(bindings)) {
        bindings = bindings.reduce((map, propName) => {
            if (typeof propName === 'string') {
                map[propName] = propName;
            }
            else if (typeof propName === 'object') {
                let { prop, key, publish, ...rest } = propName;
                
                // eslint-disable-next-line no-eq-null
                if (key == null && typeof publish !== 'string') {
                    throw new Error("The 'key' field is required for a binding: " +
                                    JSON.stringify(propName));
                }
                
                // eslint-disable-next-line no-eq-null
                prop = prop == null ? key : prop;
                
                map[prop] = {
                    ...rest,
                    key,
                    publish,
                };
            }
            
            return map;
        }, {});
    }
    
    return Object.keys(bindings || {}).map(propName => {
        const binding = bindings[propName];
        
        if (typeof binding === 'string') {
            return {
                propName,
                key: binding,
                publish: false,
            };
        }
        else if (typeof binding === 'object') {
            const { key, publish, setterName } = binding;
            
            return {
                propName,
                key: key || propName,
                publish: publish === true ? key : publish,
                ...publish ? { setterName: setterName || `set${upperFirst(propName)}` } : {},
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
        const { propName, key, publish, setterName } = binding;

        // Some bound components do not consume, only publish
        if (key) {
            out[propName] = vm.retrieve(key);
        }
        
        if (publish) {
            out[setterName] = value => vm.set(publish, value);
        }
        
        return out;
    }, {});

export const findKeyOwner = (vm, key) => {
    for (let owner = vm; owner; owner = owner.parent) {
        if (owner.store.hasOwnProperty(key)) {
            return owner;
        }
    }
    
    return null;
};

export const retrieve = (vm, key) =>
    vm.formulas[key] ? vm.formulas[key](vm.retrieve) : vm.get(key);

export const getter = (vm, key) => vm.store[key];

export const setter = async (vm, key, promisedValue) => {
    const value = await promisedValue;
    
    // If no owner was found, the key does not exist up the prototype chain,
    // which means current ViewModel is the new owner.
    (findKeyOwner(vm, key) || vm).dispatch({ [key]: value });
};

const ViewModelContext = React.createContext();

// Yes there's a prop named "props". Seemed the most apt name here ¯\_(ツ)_/¯
export const Bound = ({ props, children }) => {
    const bindings = normalizeBindings(props);
    
    return (
        <ViewModelContext.Consumer>
            { vm => children(mapProps(vm, bindings)) }
        </ViewModelContext.Consumer>
    );
};

export const withBoundProps = boundProps => Component => {
    const bindings = normalizeBindings(boundProps);
    
    // Bound props come *last*, which bears the possibility of clobbering similar named
    // props passed to component from elsewhere. This tradeoff, however, is much better
    // from debugging standpoint than the other way around.
    return componentProps => (
        <ViewModelContext.Consumer>
            { vm => <Component {...componentProps} {...mapProps(vm, bindings)} /> }
        </ViewModelContext.Consumer>
    );
};

const rootStore = {};
const rootFormulas = {};
const rootData = {};

/// !!! TODO
// Add a hook useBound()
// !!!

class ViewModelState extends React.Component {
    static getDerivedStateFromProps(props, state) {
        const { vm, dataToState } = props;
        
        return dataToState ? dataToState(vm.data, state) : null;
    }
    
    constructor(props) {
        super(props);
        
        let { initialState } = props;
        
        if (typeof initialState === 'function') {
            initialState = initialState(props);
        }

        this.state = {...initialState};
    }
    
    componentDidUpdate() {
        const { vm, observer } = this.props;
        
        if (typeof observer === 'function') {
            observer(vm.store);
        }
    }
    
    render() {
        const me = this;
        const { vm, children } = me.props;
        
        const store = { ...vm.data, ...me.state };
        vm.store = chain(vm.parent ? vm.parent.store : rootStore, store);
        
        vm.dispatch = newState => {
            me.setState(newState);
        };
    
        return (
            <ViewModelContext.Provider value={{...vm}}>
                { children }
            </ViewModelContext.Provider>
        );
    }
}

const ViewModel = ({ data, initialState, formulas, dataToState, observer, children }) => (
    <ViewModelContext.Consumer>
        { parent => {
            const vm = {
                parent: parent || null,
                formulas: chain(parent ? parent.formulas : rootFormulas, formulas),
                data: chain(parent ? parent.data : rootData, data),
                retrieve: key => retrieve(vm, key),
                get: key => getter(vm, key),
                set: (...args) => setter(vm, ...args),
            };
        
            return (
                <ViewModelState vm={vm}
                    initialState={initialState}
                    dataToState={dataToState}
                    observer={observer}>
                    { children }
                </ViewModelState>
            );
        }}
    </ViewModelContext.Consumer>
);

ViewModel.defaultProps = {
    data: {},
    initialState: {},
    formulas: {},
    dataToState: null,
};

export default ViewModel;
