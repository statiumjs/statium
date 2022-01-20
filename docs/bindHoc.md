# bind() Higher Order Component

`bind` function wraps the passed Component and injects the values from a parent Store into the Component's props. `bind` accepts two optional arguments and returns a function that accepts a valid React component.

## Default behavior with no arguments

Called with no arguments, `bind` will inject the store public API object as the `store` prop:

```javascript
const Component = ({ store }) => {
  const { data, state, set, dispatch } = store;
  ...
};

const ComponentWithStore = bind()(Component);
```

## Renaming the store prop

Called with one argument that is a string, `bind` will inject the store public API object as a prop with the provided name:

```javascript
const Component = ({ statiumStore }) => {
  const { data, state, set, dispatch } = statiumStore;
};

const ComponentWithStore = bind('statiumStore')(Component);
```

Note that the prop name cannot be a Symbol because React components do not support Symbol props. 

## Selecting values from the Store

When the first argument is a function, `bind` will execute this function at the rendering time and pass a read-only store public API object (containing only `data` and `state` properties) to the selector function. The expected return value is an object that will be merged into Component's props; the store API object itself is not injected in the props in this case.

Any Symbol properties in the return object will be ignored by the Component.

```javascript
const Component = ({ foo, bar }) => {
  ...
};

const selector = ({ data, state }) => ({
  foo: data.foo,
  bar: state.bar,
});

const ComponentWithStore = bind(selector)(Component);
```

## Structured selectors

The first argument to `bind` HOC can also be an object where keys are the prop names and values are either selector functions, or nested structured selector objects:

```javascript
const Component = ({ baz, frob }) => {
  const { blerg, zung } = frob;

  ...
};

const selectors = {
  baz: ({ state }) => state.baz,

  frob: {
    blerg: ({ data }) => data.blerg,
    zung: ({ state }) => state.zung,
  },
};

const ComponentWithStore = bind(selectors)(Component);
```

Symbol prop names in the selector object are ignored because React components do not support Symbol props, e.g. this will not work:

```javascript
const throbbe = Symbol('throbbe');

const Component = props => {
  const { [throbbe]: throb } = props;


  ...
};

const selectors = {
  [throbbe]: ({ state }) => state[throbbe],
};

const ComponentWithStore = bind(selectors)(Component);
```

If you want to use Symbol keys in the Store, map them to string prop names in selectors:

```javascript
const fruggleSym = Symbol('fruggle');

const Component = ({ fruggle }) => {
  ...
};

const selectors = {
  fruggle: fruggleSym,
};

const ComponentWithStore = bind(selectors)(Component);
```

## Binding setters and action dispatchers

The second optional argument to the `bind` HOC is an object where keys are prop names, and values are either functions or objects with key/function pairs. This object will be recursively processed in a way similar to structured selector object.

Unlike selectors, the actionable functions are not called immediately to resolve a value. Instead these functions are bound to the parent Store instance and will receive the Store public API object as the first argument when called:

```javascript
import { fetchValue } from 'some-api-module';

const Component = ({ loading, setLoading, value, loadValue }) => (
  <>
    { loading ? <div>Loading...</div> : <div>Value: {value}</div> }

    <button onClick={() => setloading(!loading)}>
      Flip loading flag
    </button>

    <button onClick={loadValue}>
      Load value
    </button>
  </>
);

const setLoading = ({ set }, value) => set({ loading: value });

const loadValue = async ({ set, dispatch }) => {
  await set({ loading: true });

  const value = await dispatch(fetchValue);

  await set({
    value,
    loading: false,
  });
};

const selector = ({ state }) => ({
  loading: state.loading,
  value: state.value,
});

const actionables = {
  setLoading,
  loadValue,
};

const ComponentWithStore = bind(selector, actionables)(Component);
```

When no values need to be selected from a Store and only actionable functions need to be injected, use `null` instead of selector function:

```javascript
const ComponentWithStore = bind(null, { ... })(Component);
```
