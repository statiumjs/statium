# Bind component

The `Bind` component provides a declarative way to access Statium Stores within a React component tree where calling a hook or splitting child components to wrap them in a HOC would be inconvenient. It works the same way as the [`bind` HOC](bindHoc.md) with no arguments, 
or the [`useStore() hook`](useStore.md).

`Bind` does not support any special props and requires a function as a child. This function will receive the Store public API object as its only argument:

```javascript
import { Bind } from 'statium';

const Component = () => (
  <Bind>
  { ({ data, state, set, dispatch }) => (
    ...
  )}
  </Bind>
);
```
