import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import "regenerator-runtime/runtime";
import isEqual from 'lodash.isequal';
import { isRoot } from '../src/context.js';
import { getKeys } from '../src/accessors.js';

configure({ adapter: new Adapter() });

// Lodash merge only copies string named properties, we need Symbol named props too
globalThis.merge = (obj, source) => {
  let protoChain = [];

  for (let src = source; !isRoot(src); src = Object.getPrototypeOf(src)) {
    protoChain.push(src);
  }

  protoChain.reverse();

  for (const src of protoChain) {
    for (const key of getKeys(src)) {
      obj[key] = src[key];
    }
  }

  return obj;
};

expect.extend({
  toBePublicStore(have, options) {
    const readOnly = !!options.readOnly;

    if (typeof have !== 'object') {
      return {
        pass: false,
        message: () => `expected store to be an object`,
      };
    }

    if (readOnly) {
      if (Object.keys(have).length !== 2 || !('data' in have) || !('state' in have)) {
        return {
          pass: false,
          message: () =>
            `expected store object to have two properties: data and state\n` +
            `received properties: ${this.utils.printReceived(Object.keys(have))}\n`,
        };
      }
    }
    else {
      if (Object.keys(have).length !== 4 || !('data' in have) || !('state' in have) ||
          !('set' in have) || !('dispatch' in have))
      {
        return {
          pass: false,
          message: () =>
            `expected store object to have 4 properties: data, state, set, and dispatch\n` +
            `received: ${this.utils.printReceived(have)}\n`
        };
      }

      if (typeof have.set !== 'function') {
        return {
          pass: false,
          message: () =>
            `expected store object to have 'set' property with a setter function`,
        };
      }

      if (typeof have.dispatch !== 'function') {
        return {
          pass: false,
          message: () =>
            `expected store object to have 'dispatch' property with a dispatcher function`,
        };
      }
    }

    if (options.data) {
      const haveData = merge({}, have.data);

      if (!isEqual(haveData, options.data)) {
        return {
          pass: false,
          message: () =>
            `expected data: ${this.utils.printExpected(options.data)}\n` +
            `received data: ${this.utils.printReceived(haveData)}\n`,
        };
      }
    }

    if (options.state) {
      const haveState = merge({}, have.state);

      if (!isEqual(haveState, options.state)) {
        return {
          pass: false,
          message: () =>
            `expected state: ${this.utils.printExpected(options.state)}\n` +
            `received state: ${this.utils.printReceived(haveState)}\n`,
        };
      }
    }

    return {
      pass: true,
      message: `received state object matches expectations`,
    };
  }
});

globalThis.sleep = (ms = 0) => new Promise(resolve => {
  setTimeout(resolve, ms);
});

globalThis.fail = message => {
  throw new Error(message ?? 'This test should fail!');
};

const cnsl = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

globalThis.bork = what => {
  console[what] = () => {};
};

globalThis.unbork = what => {
  console[what] = cnsl[what];
};
