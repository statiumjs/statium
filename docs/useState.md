# useState hook

Statium `useState` hook behaves in a way that is very similar to `React.useState` hook: it accepts an initial state value of any type as its first argument and returns an array with the first element being the _current_ value of this piece of state, and the second element being a function used to set the current value of this piece of state. Similar to `React.useState`, the setter function has a stable identity and does not change between renderings.

Unlike `React.useState`, the values are kept in a parent Store which makes these values accessible outside of the Component. By default each piece of state created by `useState` hook call will be assigned a unique Symbol key that prevents the possibility of a collision with state keys declared in a Store up the component tree; it is possible to define a name for the state key, [see below](#Named-state-keys).

```javascript
import { useState } from 'statium';

const Component = () => {
  const [foo, setFoo] = useState('bar');

  return (
    <>
      <div>foo: {foo}</div>

      <button onClick={ () => { setFoo('qux') } }>
        Set foo to qux
      </button>
    </>
  );
};
```

If `useState` is called and there is no parent Store found, an exception will be thrown. This is most likely to happen in unit tests where components are being tested in isolation; wrapping the tested component in an empty Store solves the problem. See test examples below.

In case you need it, the key name is included as the third element in the `useState` return tuple:

```javascript
import { useState } from 'statium';

const Component = () => {
  const [bar, setBar, barKey] = useState('qux');

  ...
};
```

## Named state keys

While the default behavior of Statium `useState` hook mimics `React.useState` closely, the real advantage comes from using named keys. The optional key name is the second argument to `useState`, and it can be a string or a Symbol:

```javascript
import { useState } from 'statium';

export const bazKey = Symbol('baz');

export const Parent = () => {
  const [baz] = useState('frob', bazKey);

  return (
    <div>{baz}</div>
  );
};
```

Knowing the key name allows using it to override the default value defined in the component when testing it:

```javascript
import { mount } from 'enzyme';

import { Parent, bazKey } from './Parent.js';

it("should render with correct default value for baz", () => {
  // We need to provide a Store to hold the state in.
  // If no parent Store is found, an exception will be thrown.
  const tree = mount(
    <Store>
      <Parent />
    </Store>
  );
  
  expect(tree.find('div')).toMatchInlineSnapshot(`
    <div>
      frob
    </div>
  `);
});

// Note the async test function. We are going to set the bazKey value
// after rendering the Parent component the first time, and this implies
// waiting for the state change to be complete.
it("should react to change in baz", async () => {
  const tree = mount(
    <Store>
      <Parent />
    </Store>
  );

  const storeInstance = tree.find('Store').instance();

  // Store component instance exposes the public API for using in tests.
  await storeInstance.set({ [bazKey]: 'burble' });

  // This will synchronize the tree with internal component state
  tree.update();

  expect(tree.find('div')).toMatchInlineSnapshot(`
    <div>
      burble
    </div>
  `);
});

it("should render with a different value for baz", () => {
  // Note that we are overriding the initial value here
  const tree = mount(
    <Store initialState={{ [bazKey]: "plugh" }}>
      <Parent />
    </Store>
  );

  expect(tree.find('div')).toMatchInlineSnapshot(`
    <div>
      plugh
    </div>
  `);
});
```

Accessing the value in child components is also easy:

```javascript
import { useStore } from 'statium';
import { bazKey } from './Parent.js';

export const Child = () => {
  const { state, set } = useStore();

  const baz = state[bazKey];
  const setBaz = value => set({ [bazKey]: value });
};
```
