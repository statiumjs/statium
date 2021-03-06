import ReactDOM from 'react-dom';
import { isObject, defaultSet, rootStore, StoreUnmountedError, formatForError } from './context.js';

export const getKeys = o => [...Object.getOwnPropertySymbols(o), ...Object.getOwnPropertyNames(o)];

const findOwner = (object, entityName, key) => {
  let depth = 0;

  for (let owner = object; owner; owner = owner.parent) {
    const entity = owner[entityName];

    if (isObject(entity) && entity.hasOwnProperty(key)) {
      return [owner, depth];
    }

    depth++;
  }

  return [null];
};

const getStateKeyOwner = (store, key) => {
  const [owner, depth] = findOwner(store, 'state', key);

  // If no owner was found, the key does not exist up the prototype chain.
  // This means we can't set it.
  if (!owner) {
    throw new Error(
      `Cannot find owner Store for key "${String(key)}". You need to provide an ` +
      `initial value for this key in the "state" prop of the relevant Store.`
    );
  }

  return [owner, depth];
};

export const setter = ({ store, single }, kv, value) => {
  // Trivial case for single key, used for bound value setters generated by
  // useState hook. kv is the key name in this case.
  if (single) {
    const [owner] = getStateKeyOwner(store, kv);

    // We don't need to check if owner is defined, getStateKeyOwner will throw
    // if owner is not found.
    return owner.setState({ [kv]: value });
  }

  if (!isObject(kv)) {
    // This will do the same check and throw an error. Calling it here
    // just to avoid duplicating the error message.
    defaultSet(kv);
  }

  const ownerMap = new Map();

  for (const k of getKeys(kv)) {
    // We don't need to check if owner is defined, getStateKeyOwner will throw
    // if owner is not found.
    const [owner, depth] = getStateKeyOwner(store, k);

    let o = ownerMap.get(owner);

    if (o == null) {
      o = { owner, depth, values: {}};
      ownerMap.set(owner, o);
    }

    o.values[k] = kv[k];
  }

  const sortedQueue = [...ownerMap.values()].sort((a, b) => a.depth < b.depth ? 1 : -1);
  let promises;

  // Despite being called unstable_batchedUpdates, use of this function
  // has been recommended by React developers for cases like this:
  // https://stackoverflow.com/a/48610973/458193
  ReactDOM.unstable_batchedUpdates(() => {
    promises = sortedQueue.map(item => item.owner.setState(item.values));
  });

  // Return value should be a reference to the public API on the store
  // that the update was called on initially.
  return Promise.all(promises).then(() => store.fullAPI);
};

export const dispatcher = ({ store, action, payload }) => {
  if (store.unmounted) {
    throw new StoreUnmountedError(`Cannot dispatch actions on unmounted Store "${store.tag}"`);
  }

  let handler;

  if (typeof action === 'function') {
    handler = action;
  }
  else {
    // Massage Redux style action dispatch. Payload can be an object only.
    if (isObject(action) && ('type' in action) && payload.length === 0) {
      const { type, ...eventPayload } = action;
      action = type;
      payload = [eventPayload];
    }

    const [owner] = findOwner(store, 'actions', action);

    // If owner is not defined, we need to treat that as an error. Which is
    // exactly what happens in rootStore.dispatch() below if handler is not defined.
    handler = owner && owner.actions[action];
  }

  if (typeof handler === 'function') {
    return store.defer(handler, store, ...payload);
  }

  return rootStore.dispatch(action, ...payload);
};

export const validateInitialState = (state, store) => {
  if (isObject(state)) {
    for (const key of getKeys(state)) {
      if (key in store.parent.state) {
        const [owner] = getStateKeyOwner(store, key);

        // This is not an error but a warning is warranted
        console.warn(`Initial state for Store "${store.tag}" contains a key named ` +
                     `"${String(key)}" that overrides a state key with the same name ` +
                     `provided by parent Store "${owner.tag}".`);
      }
    }

    return true;
  }

  throw new TypeError(`Invalid initial state for Store "${store.tag}": ${formatForError(state)}`);
};

export const validateStateChange = (state, values, change, tag) => {
  if (isObject(change)) {
    const invalid = getKeys(change).map(key => !(key in state) ? key : false).filter(k => k);

    if (invalid.length !== 0) {
      throw new TypeError(
        `State change received from controlStateChange function for Store "${tag}" ` +
        `includes invalid state keys ${invalid.map(k => `"${String(k)}"`).join(", ")} ` +
        `not present in the initial state. controlStateChange() cannot add new state keys.`
      );
    }

    return { ...values, ...change };
  }

  throw new TypeError(
    `controlStateChange function for Store "${tag}" returned invalid value: ` +
    `${formatForError(change)}, expected an object with new state values.`
  );
};
