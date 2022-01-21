import { StoreUnmountedError } from './context.js';

let tagCounter = 0;

export const getTag = prefix => `${prefix}-${++tagCounter}`;

const wrapProp = (def, propName, value, type, store) => {
  def.get = () => {
    if (store.unmounted) {
      throw new StoreUnmountedError(
        `Cannot read value for property "${propName}" from ${type} of unmounted Store "${store.tag}"`
      );
    }
  
    return value;
  };

  def.set = () => {
    throw new Error(`Cannot set property "${propName}" directly in state ` +
                    `of Store "${store.tag}", use set() function instead.`);
  };

  // We need this to be able to clear properties from the chained object
  def.configurable = true;
  delete def.writable;
  delete def.value;

  return def;
};

export const chain = (store, type, source) => {
  const props = Object.getOwnPropertyDescriptors(source);
  
  for (const propName in props) {
    props[propName] = wrapProp(props[propName], propName, source[propName], type, store);
  }

  return Object.create(store.parent[type], props);
};

export const assign = (store, type, source, clear, replace) => {
  const obj = store[type];

  if (clear) {
    for (const propName in Object.getOwnPropertyDescriptors(obj)) {
      delete obj[propName];
    }
  }

  const props = Object.getOwnPropertyDescriptors(source);

  for (const propName in props) {
    if (replace) {
      delete obj[propName];
    }

    props[propName] = wrapProp(props[propName], propName, source[propName], type, store);
  }

  return Object.defineProperties(obj, props);
};
