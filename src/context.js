import React from 'react';

export class StoreUnmountedError extends Error {}

export const isObject = o => o instanceof Object && o.constructor === Object;
export const formatForError = v => typeof v === 'symbol' ? String(v) : JSON.stringify(v);

export const defaultSet = kv => {
  if (!isObject(kv)) {
    throw new TypeError(`Invalid arguments: key/value object "${formatForError(kv)}" `);
  }

  const keys = Object.keys(kv).map(k => `"${String(k)}"`).join(', ');

  throw new Error(`No owner Store found to set keys: ${keys}.`);
};

const defaultDispatch = (action, ...payload) => {
  throw new Error(`Cannot find handler for action "${action}". Arguments: ${formatForError(payload)}`);
};

const rootData = {};
const rootState = new Proxy({}, {
  get: (_, prop) => {
    if (prop in Object.prototype) {
      return Object.prototype[prop];
    }

    throw new Error(`Cannot find a Store that provides state key "${String(prop)}"`);
  },
});

export const rootStore = {
  data: rootData,
  state: rootState,
  set: defaultSet,
  dispatch: defaultDispatch,
};

rootStore.readonlyAPI = Object.freeze({
  data: rootStore.data,
  state: rootStore.state,
});

rootStore.fullAPI = Object.freeze({
  data: rootStore.data,
  state: rootStore.state,
  set: rootStore.set,
  dispatch: rootStore.dispatch,
});

export const Context = React.createContext({ store: rootStore });
