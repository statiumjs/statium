import React from 'react';
import { Context, rootStore, formatForError } from './context.js';

export const useStore = () => React.useContext(Context).store.fullAPI;

export const useState = (initialState, storeKey) => {
  const { store } = React.useContext(Context);

  // Not having a valid parent Store is a hard stop.
  if (store === rootStore) {
    throw new Error(`Cannot call useState() hook: no parent Stores found`);
  }

  const [, identityFn] = React.useState(initialState);

  if (!store.tokens) {
    store.tokens = new Map();
  }

  let token = store.tokens.get(identityFn);

  if (!token) {
    if (storeKey !== undefined && !((typeof storeKey === 'string' && storeKey) || typeof storeKey === 'symbol')) {
      throw new TypeError(`Invalid useState key for store "${store.tag}": ` +
                          `"${formatForError(storeKey)}", should be a String or a Symbol`);
    }

    if (!storeKey) {
      storeKey = Symbol();
    }

    token = { storeKey, setter: store.getSingleValueSetter(storeKey) };
    store.tokens.set(identityFn, token);

    if (!(storeKey in store.state)) {
      store.state[storeKey] = initialState;
    }
  }

  return [store.state[token.storeKey], token.setter, token.storeKey];
};
