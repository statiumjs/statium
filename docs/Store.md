# Store component

Statium Store is the main component that implements state handling for React applications. It accepts several props that define its behavior, and provides a public API object with fixed properties:

```javascript
{ data, state, set, dispatch } // Full API
// or in some cases
{ data, state } // Read-only API
```

Store supports the `children` prop that can be either a valid React element, or a child function that will be passed a reference to the Store public API:

```javascript
import Store from 'statium';

const Component1 = () => (
  <Store>
    <div>This is a Store child</div>
  </Store>
);

const Component2 = () => (
  <Store>
  { ({ data, state, set, dispatch }) => (
    <div>foo: {state.foo}</div>
  )}
  </Store>
);
```

Store also accepts the following props:

## tag

Tags help forming meaningful error messages when something goes wrong and more often, identifying Store instances when testing:

```javascript
import { mount } from 'enzyme';

const Component = () => (
  <Store tag="Login">
    <LoginForm />
  </Store>
);

test("oh behave!", () => {
  const tree = mount(<Component />);

  const store = tree.find('Store[tag="Login"]').instance();
});
```

Tag prop is optional and is automatically generated when not provided. Note that tags are _not_ identifiers, having more than one Store with the same tag will not cause an error. This is not recommended however, since finding the Store you need in tests might be more difficult.

## initialState

Pass an object with key/value pairs to define the initial state of the Store:

```javascript
const initialState = {
  foo: "baz",
  bar: 42,
};

const Component = () => (
  <Store initialState={initialState}>
  { ({ state }) => (
    <div>foo: {state.foo}, bar: {state.bar}</div>
    {/* foo: baz, bar: 42 */}
  )}
  </Store>
);
```

Alternatively, `initialState` prop accepts a function that is called at the Store initialization time and is expected to return an object with key/value pairs that define the initial Store state:

```javascript
const initState = ({ data, state: parentState }) => {
  return {
    qux: parentState.foo ?? 'qux',
    baz: parentState.bar + 1,
  }
};

const Component = () => (
  <Store tag="parent" initialState={{ foo: "bar", bar: 42 }}>
    <Store initialState={initState}>
    { ({ state }) => (
      <div>qux: {state.qux}, baz: {state.baz}</div>
      {/* qux: bar, baz: 43 */}
    )}
    </Store>
  </Store>
);
```

## actions

This optional prop accepts an Object that defines named action handlers for the Store. Object keys (Strings or Symbols) are action names, and values are [action handler functions](/README.md#Action-handlers):

```javascript
const bar = Symbol('bar');

const Component = ({ children }) => (
  <Store actions={{
      foo: async ({ data, state, set, dispatch }, { value }) => {
        await set({ foo: value }};
      },
      [bar]: async ({ data, state, set, dispatch }) => {
        await dispatch({
          type: "foo",
          value: 42,
        });
      },
    }}>
    {children}
  </Store>
);
```

In the example above we are using Redux style `dispatch` invocation, passing an object with `type` property that is the action name. When the action is dispatched, the `type` property is extracted from the object and used to find the action handler function; the other properties are passed to the action handler as its second argument.

Using named actions is optional and is mostly useful for migrating from Redux based legacy code. In the new code it is much easier to dispatch action handler functions directly:

```javascript
const { handler } = import './actions.js';

const Component = () => (
  <Store>
  { ({ dispatch }) => (
    <button onClick={() => dispatch(handler)}>Click me!</button>
  )}
  </Store>
);
```

## controlStateChange

This optional prop accepts a function that is called **synchronously** before the Store's own internal state is about to change. This function is passed an object with the inbound next **own** state as the first argument, and read-only Store API object as the second. The return value of this function is expected to be an object with actual values for the state keys that need to be changed from the inbound state, i.e. the difference between inbound state and actual next state:

```javascript
const reducer = nextState => {
  let { foo, bar } = nextState;

  if (foo === 42) {
    bar = "qux";
  }

  return { bar };
};

const Component = () => (
  <Store initialState={{ foo: 0, bar: "baz" }} controlStateChange={reducer}>
  { ({ state, set }) => (
    <div>
      <span>bar: {state.bar}</span>

      <button onClick={() => set({ foo: 42 })}>
        Set foo to 42
      </button>
    </div>
  )}
  </Store>
);
```

One important thing to note is that `nextState` only contains values for the Store's own state and does not include parent values. It is also not necessary to return _full_ state from reducer, although it is not an error to do so:

```javascript
const reducer = nextState => {
  let { foo, bar } = nextState;

  if (foo === 42) {
    bar = "qux";
  }

  // This will work the same as example above
  return {
    ...nextState,
    bar,
  };
};
```

One useful application for `controlStateChange` is validating form values. Note that the `errors` state value is never set directly, it is computed from `email` and `password` values and is returned from reducer to be applied to the next state:

```javascript
import { login } from './actions.js';

const initialState = {
  email: '',
  password: '',
  errors: {},
};

const validate = ({ email, password }) => ({
  errors: {
    email: email !== '' && !/^.+@.+\..+$/.test(email) // naïve check
      ? 'Invalid e-mail address'
      : null,
    password: password !== '' && password.length < 3
      ? 'Invalid password: should be longer than 3 characters'
      : null,
  },
});

const LoginForm = () => (
  <Store initialState={initialState} controlStateChange={validate}>
  { ({ state: { email, password, errors }, set, dispatch }) => (
    <form onSubmit={() => dispatch(login, { email, password })}>
      <fieldset>
        <input type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => set({ email: e.target.value }) } />
        
        <div>
          {errors.email}
        </div>
      </fieldset>

      <fieldset>
        <input type="password"
          placeholder="Password"
          value={password}
          onChange={e => set({ password: e.target.value })} />
        
        <div>
          {errors.password}
        </div>
      </fieldset>

      <button type="submit">Log in</button>
    </form>
  )}
  </Store>
);
```

The second argument to `controlStateChange` function is the read-only Store API that can be used for accessing `data` and **current** (not next!) `state` in the Store and its ancestors.

## onStateChange

This optional prop accepts a function that is called after the Store's own internal state has been changed and has finished updating. This observer is not invoked upon Store rendering, e.g. when a parent Store state changes. The full Store API is provided as the only argument to the observer function:

```javascript
const observer = ({ data, state, set, dispatch }) => {
  ...
};

const Component = () => (
  <Store initialState={{ foo: 42 }} onStateChange={observer} />
);
```
