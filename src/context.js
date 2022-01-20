import React from 'react';

export const accessorType = Symbol.for('accessorType');
export const isObject = o => o instanceof Object && o.constructor === Object;
export const formatForError = v => typeof v === 'symbol' ? String(v) : JSON.stringify(v);

export class StoreUnmountedError extends Error {
  constructor(...args) {
    super(...args);

    this.isStoreUnmounted = true;
  }
}

export const defaultSet = kv => {
  if (!isObject(kv))
    throw new TypeError(`Invalid arguments: key/value object "${formatForError(kv)}" `);

  const keys = Object.keys(kv).map(k => `"${String(k)}"`).join(', ');

  throw new Error(`No owner Store found to set keys: ${keys}.`);
};

const defaultDispatch = (action, ...payload) => {
  throw new Error(`Cannot find handler for action "${action}". Arguments: ${formatForError(payload)}`);
};

const rootData = {};
const rootState = new Proxy({}, {
  get: (_, prop) => {
    if (prop in Object.prototype) return Object.prototype[prop];

    throw new Error(`Cannot find a Store that provides state key "${String(prop)}"`);
  },
});

export const isRoot = obj => obj === rootData || obj === rootState;

export const rootStore = {
  $rootStore: true,
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

const _StatiumContext = '$StatiumContext';

// One often encountered problem is package being included more than once
// in the application bundle, due to bundler misconfiguration or some other
// reason. If that happens, each copy of the Statium package will have its own
// copy of private Context; this will lead to _seriously_ hairy bugs
// that are really hard to track.
// To avoid this issue, we simply cache context object in the global object.
export const Context = (() => {
  let context;

  try {
    context = window[_StatiumContext];

    // This is not easily testable.
    /* istanbul ignore next */
    if (!context) {
      throw new Error();
    }
  }
  catch (e) {
    context = React.createContext({ store: rootStore });
    context.displayName = 'StoreContext';

    window[_StatiumContext] = context;
  }

  return context;
})();
