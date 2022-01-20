import React from 'react';
import { mount } from 'enzyme';

import Store, { useStore, useState } from '../src';

describe("useStore hook", () => {
  let have;

  const Component = ({ input }) => {
    have = useStore(input);

    return 'component';
  };

  const makeComponent = input => {
    mount(
      <Store>
        <Component input={input} />
      </Store>
    );
  };

  beforeEach(() => {
    bork('error');
  });

  afterEach(() => {
    unbork('error');
    have = null;
  });

  it("should return getter, setter, and dispatcher", () => {
    makeComponent();

    expect(have).toBePublicStore({});
  });
});

describe("useState hook", () => {
  // eslint-disable-next-line no-unused-vars
  let tree, value1, value2, setter1, setter2, key1, key2;

  const Component = ({ init1, initKey1, init2, initKey2 }) => {
    const [v1, s1, k1] = useState(init1, initKey1);
    const [v2, s2, k2] = useState(init2, initKey2);

    value1 = v1;
    setter1 = s1;
    key1 = k1;

    value2 = v2;
    setter2 = s2;
    key2 = k2;

    return null;
  };

  const makeComponent = (init1, init2, key1, key2, storeProps = {}) => {
    return tree = mount(
      <Store tag="useState" {...storeProps}>
        <Component init1={init1} init2={init2} initKey1={key1} initKey2={key2} />;
      </Store>
    );
  }

  beforeEach(() => {
    bork('error');
  });

  afterEach(() => {
    unbork('error');
    tree = value1 = value2 = setter1 = setter2 = key1 = key2 = null;
  });

  describe("initialization", () => {
    const tests = [{
      name: 'undefined',
      value: undefined,
    }, {
      name: 'null',
      value: null,
    }, {
      name: 'boolean',
      value: false,
    }, {
      name: 'number',
      value: 0,
    }, {
      name: 'string',
      value: 'fufft',
    }];

    tests.forEach(({ name, value }) => {
      ((name, value) => {
        it(`should work with ${name}`, () => {
          makeComponent(value);

          expect(value1).toBe(value);
        });
      })(name, value);
    });

    it("should allow initializing a value in the Store state, overriding hook argument", () => {
      const bregt = Symbol('bregt');

      makeComponent('gworf', 'manku', 'qwumple', bregt, {
        initialState: {
          qwumple: 'tunto',
          [bregt]: 'ayengo',
        },
      });

      expect(value1).toBe('tunto');
      expect(value2).toBe('ayengo');
    });

    it("should allow keeping state values in a grandparent Store", async () => {
      const tree = mount(
        <Store tag="gramps" initialState={{ sedum: "untuk" }}>
          <Store tag="parent">
            <Store tag="child">
              <Component init1="krangle" initKey1="sedum" />;
            </Store>
          </Store>
        </Store>
      );

      expect(value1).toBe('untuk');

      await tree.find('Store[tag="gramps"]').instance().set({ sedum: 'gord' });

      expect(value1).toBe('gord');
    });

    it("should throw an exception when there is no parent Store", () => {
      expect(() => {
        mount(<Component init1="kwaggle" />)
      })
        .toThrow('Cannot call useState() hook: no parent Stores found');
    });
  });

  describe("setter", () => {
    it("should allow setting value", async () => {
      makeComponent('dupt', 'kurg');

      expect(value1).toBe('dupt');
      expect(value2).toBe('kurg');

      await setter1('wopp');

      expect(value1).toBe('wopp');
      expect(value2).toBe('kurg');
    });

    it("should allow setting value more than once", async () => {
      makeComponent('eong', 'tyrb');

      expect(value1).toBe('eong');
      expect(value2).toBe('tyrb');

      await setter2('nurp');

      expect(value1).toBe('eong');
      expect(value2).toBe('nurp');

      await setter2('zurp');

      expect(value1).toBe('eong');
      expect(value2).toBe('zurp');
    });

    it("should have stable identity across renders", async () => {
      makeComponent('varumpt');

      const setterFn = setter1;

      await setter1('lomponk');

      expect(setter1).toBe(setterFn);

      await setter1('optuz');

      expect(setter1).toBe(setterFn);
    });

    it("should set values after initializing with overridden values", async () => {
      const nopple = Symbol('nopple');

      makeComponent('adre', 'urka', 'ponk', nopple, {
        initialState: {
          ponk: 'erdu',
          [nopple]: 'jurrgh',
        },
      });

      expect(value1).toBe('erdu');
      expect(value2).toBe('jurrgh');

      await tree.find('Store').instance().set({
        ponk: 'furtle',
        [nopple]: 'marki',
      });

      expect(tree.find('Store').instance().store).toBePublicStore({
        data: {},
        state: {
          ponk: 'furtle',
          [nopple]: 'marki',
        },
      });
    });

    it("should allow setting state values in a grandparent Store", async () => {
      mount(
        <Store tag="gramps" initialState={{ terso: "wontum" }}>
          <Store tag="parent">
            <Store tag="child">
              <Component init1="burbr" initKey1="terso" />;
            </Store>
          </Store>
        </Store>
      );

      expect(value1).toBe('wontum');

      // This is useState() setter, it accepts only one argument: new value
      await setter1('mork');

      expect(value1).toBe('mork');
    });
  });

  describe("reading with store key", () => {
    it("should return the store key", async () => {
      makeComponent('ronff');

      const instance = tree.find('Store').instance();

      expect(instance.store.state[key1]).toBe('ronff');

      await instance.set({ [key1]: 'ghouz' });

      expect(instance.store.state[key1]).toBe('ghouz');
    });

    it("should allow passing in the store key", async () => {
      makeComponent('kozlo', null, 'bunzle');

      const instance = tree.find('Store').instance();

      expect(instance.store.state.bunzle).toBe('kozlo');

      await instance.set({ bunzle: 'whurff' });

      expect(instance.store.state.bunzle).toBe('whurff');
      expect(value1).toBe('whurff');
    });

    it("should throw an exception on invalid store key", () => {
      expect(() => {
        makeComponent('monno', null, false);
      })
        .toThrow(
          `Invalid useState key for store "useState": "false", should be a String or a Symbol`
        );
    });
  });
});
