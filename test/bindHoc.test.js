import React from 'react';
import { mount } from 'enzyme';
import { createStructuredSelector } from 'reselect';

import Store, { bind } from '../src';

const swump = Symbol('swump');
const klopp = Symbol('klopp');

const data = {
  derji: "mroff",
  [swump]: "qetz",
};

const state = {
  ferb: "logh",
  [klopp]: "ruph",
};

const derjiSelector = store => store.data.derji;
const swumpSelector = store => store.data[swump];
const ferbSelector = store => store.state.ferb;
const kloppSelector = store => store.state[klopp];

describe("bind() HOC", () => {
  let have;

  const Container = ({ children }) => (
    <Store data={data} initialState={state}
      actions={{
        brunken: ({ set }, value) => set({ [klopp]: value }),
      }}>
      {children}
    </Store>
  );

  const Component = props => {
    have = props;

    return <div>component was here</div>
  };

  const makeStore = (...bindArgs) => {
    const Cmp = bind(...bindArgs)(Component);

    return mount(
      <Container>
        <Cmp />
      </Container>
    );
  };

  beforeEach(() => {
    bork('error');
    have = null;
  });

  afterEach(() => {
    unbork('error');
  });

  describe("no arguments", () => {
    it("should inject store as 'store' prop", () => {
      makeStore();

      expect(Object.keys(have)).toEqual(['store']);
      expect(have.store).toBePublicStore({ data, state });
    });
  });

  describe("single non-function argument", () => {
    it("should throw an exception if storeProp is a Symbol", () => {
      expect(() => {
        makeStore(Symbol('dwork'));
      })
      .toThrow("Invalid bind() argument: Symbol(dwork)");
    });

    it("should inject store as a prop with given name", () => {
      makeStore('bowwo');

      expect(Object.keys(have)).toEqual(['bowwo']);
      expect(have.bowwo).toBePublicStore({ data, state });
    });

    it("should throw an exception if the argument is invalid", () => {
      expect(() => {
        makeStore([false]);
      })
      .toThrow(`Invalid bind() argument: [false]`);
    });
  });

  describe("selectors", () => {
    it("should map data and state to props", () => {
      const want = {
        derji: "mroff",
        swump: "qetz",
        ferb: "logh",
        klopp: "ruph",
      };
  
      const selector = ({ data, state }) => ({
        derji: data.derji,
        swump: data[swump],
        ferb: state.ferb,
        klopp: state[klopp],
      });

      makeStore(selector);

      expect(have).toEqual(want);
    });

    it("should pass read-only store API to the selector function", () => {
      let store;

      const selector = _store => {
        store = _store;
        return {};
      };

      makeStore(selector);

      expect(store).toBePublicStore({
        readOnly: true,
        data: {
          derji: "mroff",
          [swump]: "qetz",
        },
        state: {
          ferb: "logh",
          [klopp]: "ruph",
        },
      });
    });

    it("should throw an exception on invalid selector", () => {
      expect(() => {
        makeStore({ groppo: ["kluj"] });
      })
      .toThrow(`Invalid selector with key groppo: ["kluj"]`);
    });

    describe("structured selector", () => {
      const want = {
        mappedData: {
          derji: "mroff",
          swump: "qetz",
        },
        mappedState: {
          ferb: "logh",
          klopp: "ruph",
        },
      };

      it("should work with reselect", () => {
        const selector = createStructuredSelector({
          mappedData: createStructuredSelector({
            derji: derjiSelector,
            swump: swumpSelector,
          }),
          mappedState: createStructuredSelector({
            ferb: ferbSelector,
            klopp: kloppSelector,
          }),
        });

        makeStore(selector);

        expect(have).toEqual(want);
      });

      it("should work the same way without reselect", () => {
        const selector = {
          mappedData: {
            derji: derjiSelector,
            swump: swumpSelector,
          },
          mappedState: {
            ferb: ferbSelector,
            klopp: kloppSelector,
          },
        };

        makeStore(selector);

        expect(have).toEqual(want);
      });

      it("should pass read-only store API to structured selectors", () => {
        let store;

        const selector = {
          derji: _store => {
            store = _store;
            return store.data.derji;
          },
        };

        makeStore(selector);

        expect(have).toEqual({
          derji: data.derji,
        });

        expect(store).toBePublicStore({
          readOnly: true,
          data: {
            derji: "mroff",
            [swump]: "qetz",
          },
          state: {
            ferb: "logh",
            [klopp]: "ruph",
          },
          });
      });
    });
  });

  describe("setters and dispatchers", () => {
    // Binding setter functions is largely just for Redux compatibility.
    it("should bind a setter function", async () => {
      makeStore({ ferb: ferbSelector }, {
        setFerb: ({ set }, value) => set({ ferb: value }),
      });

      expect(have.ferb).toBe('logh');
      expect(typeof have.setFerb).toBe('function');

      await have.setFerb('brupp');

      expect(have.ferb).toBe('brupp');
    });

    it("should bind a dispatcher function", async () => {
      makeStore({ klopp: kloppSelector }, {
        krabble: {
          brunken: ({ dispatch }, value) => dispatch('brunken', value),
        },
      });

      expect(have.klopp).toBe('ruph');
      expect(typeof have.krabble.brunken).toBe('function');

      await have.krabble.brunken('swuff');

      expect(have.klopp).toBe('swuff');
    });

    it("should allow null for selectors", async () => {
      const fn = jest.fn();

      makeStore(null, { grib: fn });

      expect(typeof have.grib).toBe('function');

      await have.grib();

      expect(fn).toHaveBeenCalled();
    });

    it("should throw an exception if first argument is invalid", () => {
      expect(() => {
        makeStore(42, {
          truppken: () => {},
        });
      })
      .toThrow('First argument to bind() should be a valid selector function or object');
    });

    it("should throw an exception if second argument is invalid", () => {
      expect(() => {
        makeStore({ klopp: kloppSelector }, [{ welpt: () => {} }]);
      })
      .toThrow('Second argument to bind() should be an object with setter/dispatcher function values');
    });

    it("should throw an exception if bound function property is invalid", () => {
      expect(() => {
        makeStore({ klopp: kloppSelector }, {
          foung: null,
        });
      })
      .toThrow(`Expected function in key "foung", got null`);
    });
  });
});
