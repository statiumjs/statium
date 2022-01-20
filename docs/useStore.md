# useStore hook

The `useStore` hook can be used to access Statium Stores in functional React components. It works the same way as the [`Bind` component](Bind.md) or [`bind` HOC](bindHoc.md) with no arguments.

`useStore` does not accept arguments and returns a public API object for the parent Store:

```javascript
import { useStore } from 'statium';

const FunctionalComponent = () => {
  const { data, state, set, dispatch } = useStore();

  ...
};

```
