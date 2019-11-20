'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));

/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

var _baseSlice = baseSlice;

/**
 * Casts `array` to a slice if it's needed.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {number} start The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the cast slice.
 */
function castSlice(array, start, end) {
  var length = array.length;
  end = end === undefined ? length : end;
  return (!start && end >= length) ? array : _baseSlice(array, start, end);
}

var _castSlice = castSlice;

/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f',
    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
    rsComboSymbolsRange = '\\u20d0-\\u20ff',
    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsZWJ = '\\u200d';

/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboRange + rsVarRange + ']');

/**
 * Checks if `string` contains Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a symbol is found, else `false`.
 */
function hasUnicode(string) {
  return reHasUnicode.test(string);
}

var _hasUnicode = hasUnicode;

/**
 * Converts an ASCII `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function asciiToArray(string) {
  return string.split('');
}

var _asciiToArray = asciiToArray;

/** Used to compose unicode character classes. */
var rsAstralRange$1 = '\\ud800-\\udfff',
    rsComboMarksRange$1 = '\\u0300-\\u036f',
    reComboHalfMarksRange$1 = '\\ufe20-\\ufe2f',
    rsComboSymbolsRange$1 = '\\u20d0-\\u20ff',
    rsComboRange$1 = rsComboMarksRange$1 + reComboHalfMarksRange$1 + rsComboSymbolsRange$1,
    rsVarRange$1 = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsAstral = '[' + rsAstralRange$1 + ']',
    rsCombo = '[' + rsComboRange$1 + ']',
    rsFitz = '\\ud83c[\\udffb-\\udfff]',
    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
    rsNonAstral = '[^' + rsAstralRange$1 + ']',
    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
    rsZWJ$1 = '\\u200d';

/** Used to compose unicode regexes. */
var reOptMod = rsModifier + '?',
    rsOptVar = '[' + rsVarRange$1 + ']?',
    rsOptJoin = '(?:' + rsZWJ$1 + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
    rsSeq = rsOptVar + reOptMod + rsOptJoin,
    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

/**
 * Converts a Unicode `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function unicodeToArray(string) {
  return string.match(reUnicode) || [];
}

var _unicodeToArray = unicodeToArray;

/**
 * Converts `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function stringToArray(string) {
  return _hasUnicode(string)
    ? _unicodeToArray(string)
    : _asciiToArray(string);
}

var _stringToArray = stringToArray;

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

var _freeGlobal = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal || freeSelf || Function('return this')();

var _root = root;

/** Built-in value references. */
var Symbol = _root.Symbol;

var _Symbol = Symbol;

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

var _arrayMap = arrayMap;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

var isArray_1 = isArray;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

var _getRawTag = getRawTag;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

var _objectToString = objectToString;

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag$1 && symToStringTag$1 in Object(value))
    ? _getRawTag(value)
    : _objectToString(value);
}

var _baseGetTag = baseGetTag;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

var isObjectLike_1 = isObjectLike;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike_1(value) && _baseGetTag(value) == symbolTag);
}

var isSymbol_1 = isSymbol;

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = _Symbol ? _Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray_1(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return _arrayMap(value, baseToString) + '';
  }
  if (isSymbol_1(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

var _baseToString = baseToString;

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : _baseToString(value);
}

var toString_1 = toString;

/**
 * Creates a function like `_.lowerFirst`.
 *
 * @private
 * @param {string} methodName The name of the `String` case method to use.
 * @returns {Function} Returns the new case function.
 */
function createCaseFirst(methodName) {
  return function(string) {
    string = toString_1(string);

    var strSymbols = _hasUnicode(string)
      ? _stringToArray(string)
      : undefined;

    var chr = strSymbols
      ? strSymbols[0]
      : string.charAt(0);

    var trailing = strSymbols
      ? _castSlice(strSymbols, 1).join('')
      : string.slice(1);

    return chr[methodName]() + trailing;
  };
}

var _createCaseFirst = createCaseFirst;

/**
 * Converts the first character of `string` to upper case.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category String
 * @param {string} [string=''] The string to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.upperFirst('fred');
 * // => 'Fred'
 *
 * _.upperFirst('FRED');
 * // => 'FRED'
 */
var upperFirst = _createCaseFirst('toUpperCase');

var upperFirst_1 = upperFirst;

const _jsxFileName = "/Users/nohuhu/DataStax/statium/src/ViewModel.js";
const chain = (proto, props) => Object.assign(Object.create(proto), props);

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
const normalizeBindings = bindings => {
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
                ...publish ? { setterName: setterName || `set${upperFirst_1(propName)}` } : {},
            };
        }
        else {
            // TODO Better error handling
            throw new Error('Invalid bound prop definition');
        }
    });
};

const mapProps = (vm, bindings) =>
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

const findKeyOwner = (vm, key) => {
    for (let owner = vm; owner; owner = owner.parent) {
        if (owner.store.hasOwnProperty(key)) {
            return owner;
        }
    }
    
    return null;
};

const retrieve = (vm, key) =>
    vm.formulas[key] ? vm.formulas[key](vm.retrieve) : vm.get(key);

const getter = (vm, key) => vm.store[key];

const setter = async (vm, key, promisedValue) => {
    const value = await promisedValue;
    
    // If no owner was found, the key does not exist up the prototype chain,
    // which means current ViewModel is the new owner.
    (findKeyOwner(vm, key) || vm).dispatch({ [key]: value });
};

const ViewModelContext = React.createContext();

// Yes there's a prop named "props". Seemed the most apt name here ¯\_(ツ)_/¯
const Bound = ({ props, children }) => {
    const bindings = normalizeBindings(props);
    
    return (
        React.createElement(ViewModelContext.Consumer, {__self: null, __source: {fileName: _jsxFileName, lineNumber: 251}}
            ,  vm => children(mapProps(vm, bindings)) 
        )
    );
};

const withBoundProps = boundProps => Component => {
    const bindings = normalizeBindings(boundProps);
    
    // Bound props come *last*, which bears the possibility of clobbering similar named
    // props passed to component from elsewhere. This tradeoff, however, is much better
    // from debugging standpoint than the other way around.
    return componentProps => (
        React.createElement(ViewModelContext.Consumer, {__self: null, __source: {fileName: _jsxFileName, lineNumber: 264}}
            ,  vm => React.createElement(Component, { ...componentProps, ...mapProps(vm, bindings), __self: null, __source: {fileName: _jsxFileName, lineNumber: 265}} ) 
        )
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
            React.createElement(ViewModelContext.Provider, { value: {...vm}, __self: this, __source: {fileName: _jsxFileName, lineNumber: 317}}
                ,  children 
            )
        );
    }
}

const ViewModel = ({ data, initialState, formulas, dataToState, observer, children }) => (
    React.createElement(ViewModelContext.Consumer, {__self: null, __source: {fileName: _jsxFileName, lineNumber: 325}}
        ,  parent => {
            const vm = {
                parent: parent || null,
                formulas: chain(parent ? parent.formulas : rootFormulas, formulas),
                data: chain(parent ? parent.data : rootData, data),
                retrieve: key => retrieve(vm, key),
                get: key => getter(vm, key),
                set: (...args) => setter(vm, ...args),
            };
        
            return (
                React.createElement(ViewModelState, { vm: vm,
                    initialState: initialState,
                    dataToState: dataToState,
                    observer: observer, __self: null, __source: {fileName: _jsxFileName, lineNumber: 337}}
                    ,  children 
                )
            );
        }
    )
);

ViewModel.defaultProps = {
    data: {},
    initialState: {},
    formulas: {},
    dataToState: null,
};

exports.Bound = Bound;
exports.chain = chain;
exports.default = ViewModel;
exports.findKeyOwner = findKeyOwner;
exports.getter = getter;
exports.mapProps = mapProps;
exports.normalizeBindings = normalizeBindings;
exports.retrieve = retrieve;
exports.setter = setter;
exports.withBoundProps = withBoundProps;
