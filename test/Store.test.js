import React from 'react';
import { mount } from 'enzyme';

import Store, { Bind, useStore, StoreUnmountedError } from '../src';
import { storeProp, reactSetState } from '../src/Store.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error) {
    this.setState({ error });
  }

  render() {
    if (this.state.error) {
      return (
        <div>
          {String(this.state.error)}
        </div>
      );
    }

    return this.props.children;
  }
}

class Container extends React.Component {
  constructor(props) {
    super(props);

    this.state = { mounted: true };
  }

  render() {
    const { children } = this.props;

    if (this.state.mounted) {
      return children;
    }

    return <div>not mounted</div>;
  }
}

describe("Store component", () => {
  const oldConsoleError = console.error;
  let store;

  const saveStore = _store => { store = _store };

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = oldConsoleError;
    store = null;
  });

  describe("rendering", () => {
    it("should accept a bind shortcut function as a child", () => {
      mount(
        <Store data={{ yippit: "kroo" }}>
          {saveStore}
        </Store>
      );

      expect(store).toBePublicStore({
        data: {
          yippit: "kroo",
        },
        state: {},
      });
    });

    it("should accept a React function component as a child without passing store to it", () => {
      let cmpProps;

      const Component = props => {
        cmpProps = props;

        return <div>krumpo</div>;
      };

      const tree = mount(
        <Store>
          <Component />
        </Store>
      );

      expect(tree.find('Component')).toMatchInlineSnapshot(`
        <Component>
          <div>
            krumpo
          </div>
        </Component>
      `);

      expect(Object.keys(cmpProps)).toEqual([]);
    });

    it("should accept React component(s) as children", () => {
      const tree = mount(
        <Store>
          <div>
            <span>
              donno
            </span>
          </div>
        </Store>
      );

      expect(tree.find('div')).toMatchInlineSnapshot(`
        <div>
          <span>
            donno
          </span>
        </div>
      `);
    });
  });

  describe("data", () => {
    describe("own", () => {
      it("should allow binding to own data", () => {
        const data = { foo: 'bar' };

        mount(
          <Store data={data}>
            <div>
              <Bind>
                {saveStore}
              </Bind>
            </div>
          </Store>
        );

        expect(store).toBePublicStore({ data });
      });

      it("should allow passing data with complex objects", () => {
        const data = Object.defineProperties({}, {
          bar: {
            get: () => 'qux',
          },
        });

        mount(
          <Store data={data}>
            {saveStore}
          </Store>
        );

        expect(store).toBePublicStore({
          data: {
            bar: 'qux',
          },
        });
      });

      it("should pass new data if changed when re-rendered", () => {
        const data = { krog: "bammo" };

        const tree = mount(
          <Container>
            <Store data={data}>
              <div>
                <Bind>
                  {({ data }) => <span>{JSON.stringify(merge({}, data))}</span>}
                </Bind>
              </div>
            </Store>
          </Container>
        );

        expect(tree.find('span')).toMatchInlineSnapshot(`
          <span>
            {"krog":"bammo"}
          </span>
        `);

        // Mutate the object to avoid changing reference. This is only relevant
        // in unit tests because we need to make sure the same Enzyme tree is being
        // tested the second time; when the Store component is rendered the first
        // time it will close over the object reference and it will be impossible
        // to change it without destroying the tree and remounting it again, which
        // defeats the purpose of this test.
        delete data.krog;
        data.dho = 'nha';

        // This is to force Store render without unmounting it.
        // We're not using state in this test so the value is irrelevant.
        tree.find('Store').instance()[reactSetState]({ krung: "astoo" });
        tree.update();

        expect(tree.find('span')).toMatchInlineSnapshot(`
          <span>
            {"dho":"nha"}
          </span>
        `);
      });

      it("should throw an exception trying to set a data key", () => {
        const tree = mount(
          <Store tag="read-only" data={{ garum: true }} />
        );

        expect(() => {
          tree.find('Store').instance().set({ garum: false });
        })
        .toThrow('Cannot find owner Store for key "garum". You need to provide an initial value for this key in the "state" prop of the relevant Store.');
      });
    });

    describe("hierarchical", () => {
      it("should allow binding to inherited data", () => {
        mount(
          <Store data={{ bar: 'baz' }}>
            <div>
              <Store data={{ qux: 'moof' }}>
                {saveStore}
              </Store>
            </div>
          </Store>
        );

        expect(store).toBePublicStore({
          data: {
            bar: 'baz',
            qux: 'moof',
          },
        });
      });

      it("should pass inherited data if changed on re-render", () => {
        const parentData = {
          turkle: "nopz",
        };

        const childData = {
          cuggle: "juzz",
        };

        const tree = mount(
          <Store tag="parent" data={parentData}>
            <div>
              <Store tag="child" data={childData}>
                <div>
                  <Bind>
                    {({ data }) => <span>{JSON.stringify(merge({}, data))}</span>}
                  </Bind>
                </div>
              </Store>
            </div>
          </Store>
        );

        expect(tree.find('span')).toMatchInlineSnapshot(`
          <span>
            {"turkle":"nopz","cuggle":"juzz"}
          </span>
        `);

        // Mutate the object to avoid changing reference. See the comment above.
        delete parentData.turkle;
        parentData.bugh = "moap";
        parentData.seph = "htung";

        // Force parent Store render without unmounting it.
        // We're not using state in this test so the value is irrelevant.
        tree.find('Store[tag="parent"]').instance()[reactSetState]({ lopp: null });
        tree.update();

        expect(tree.find('span')).toMatchInlineSnapshot(`
          <span>
            {"bugh":"moap","seph":"htung","cuggle":"juzz"}
          </span>
        `);
      });
    });
  });

  describe("state", () => {
    describe("initializing", () => {
      it("should allow initializing state with an object", () => {
        const state = { blerg: 'knurf' };

        mount(
          <Store initialState={state}>
            <div>
              <Bind>
                {saveStore}
              </Bind>
            </div>
          </Store>
        );

        expect(store).toBePublicStore({
          state,
        });
      });

      it("should allow initializing state with a function", () => {
        let initialStore;
        const state = { hloom: 'kazoo' };

        mount(
          <Store initialState={_store => {
            // Need to make a copy here since the store object passed in here
            // will be later modified to have set and dispatch functions.
            // This is done by assigning to the same object.
            initialStore = { ..._store };
            return state;
          }}>
            {saveStore}
          </Store>
        );

        // Store object passed to state initializer function should be read only
        expect(initialStore).toBePublicStore({
          readOnly: true,
          data: {},
          state: {},
        });

        // Store object passed to child function should be fully populated
        expect(store).toBePublicStore({
          state,
        });
      });

      it("should pass data and state to state initializer function", () => {
        let store;

        const want = {
          krabbe: "dunz",
          byrge: "aax",
          ponz: "duuk",
        };

        mount(
          <Store data={{ krabbe: "dunz", byrge: "aax" }}>
            <Store initialState={{ ponz: "duuk" }}>
              <Store initialState={({ data, state }) => {
                store = {
                  krabbe: data.krabbe,
                  byrge: data.byrge,
                  ponz: state.ponz,
                };

                return {};
              }} />
            </Store>
          </Store>
        );

        expect(store).toMatchObject(want);
      });

      it("should throw an exception on invalid initial state", () => {
        expect(() => {
          mount(
            <Store tag="invalid" initialState={null} />
          );
        })
        .toThrow(`Invalid initial state for Store "invalid": null`);
      });

      describe("validation", () => {
        let warn;

        beforeEach(() => {
          warn = console.warn;
          console.warn = jest.fn();
        });

        afterEach(() => {
          console.warn = warn;
          warn = null;
        });

        it("should warn when overriding parent state key", () => {
          mount(
            <Store tag="jaffa" initialState={{ ryup: "vorp" }}>
              <Store tag="inggo" initialState={{ ryup: "mubble" }} />
            </Store>
          );

          expect(console.warn).toHaveBeenCalledWith(
            'Initial state for Store "inggo" contains a key named ' +
            '"ryup" that overrides a state key with ' +
            'the same name provided by parent Store "jaffa".'
          );
        });
      });
    });

    // Getting own state is pretty much covered in "initializing" block above
    describe("getting", () => {
      it("should allow getting inherited state", () => {
        mount(
          <Store initialState={{ gurgle: "throbbe" }}>
            <div>
              <Store initialState={() => ({ mymse: "puxx" })}>
                {saveStore}
              </Store>
            </div>
          </Store>
        );

        expect(store).toBePublicStore({
          state: {
            gurgle: 'throbbe',
            mymse: 'puxx',
          },
        });
      });

      it("should throw an exception if state key is not found", () => {
        const tree = mount(
          <Store initialState={{ mussle: "warop" }} />
        );

        expect(() => {
          tree.find('Store').instance().store.state.graffa;
        })
        .toThrow('Cannot find a Store that provides state key "graffa"');
      });
    });

    describe("setting", () => {
      let setter;

      afterEach(() => {
        setter = null;
      });

      it("should throw an error trying to set undeclared key", () => {
        const tree = mount(
          <Store />
        );

        // This is a bit of a kludge
        expect(() => {
          tree.find('Store').instance()[storeProp].parent.set({ nanook: 'wazoo' });
        })
        .toThrow('No owner Store found to set keys: "nanook".');
      });

      it("should throw an error trying to set multiple undeclared keys", () => {
        const tree = mount(
          <Store />
        );

        // Ditto
        expect(() => {
          tree.find('Store').instance()[storeProp].parent.set({
            qwaiu: "borm",
            dert: "wiyot",
          });
        })
        .toThrow(`No owner Store found to set keys: "qwaiu", "dert".`);
      });

      it("should set own state", async () => {
        const tree = mount(
          <Store initialState={{ peckle: "juff" }}>
            {({ state, set }) => {
              setter = set;

              return <div>{state.peckle}</div>
            }}
          </Store>
        );

        expect(tree.find('div')).toMatchInlineSnapshot(`
          <div>
            juff
          </div>
        `);

        const updatedStore = await setter({ peckle: 'packle' });
        tree.update();

        expect(tree.find('div')).toMatchInlineSnapshot(`
          <div>
            packle
          </div>
        `);

        expect(updatedStore).toBePublicStore({
          data: {},
          state: { peckle: 'packle' },
        });
      });

      it("should resolve promise when setting state keys to unchanged value", async () => {
        let renderCount = 0;

        const tree = mount(
          <Store initialState={{ monjo: "drupp" }}>
            {({ state, set }) => {
              renderCount++;
              setter = set;

              return <span>{state.monjo}</span>
            }}
          </Store>
        );

        expect(renderCount).toBe(1);
        expect(tree.find('span')).toMatchInlineSnapshot(`
          <span>
            drupp
          </span>
        `);

        const store = await setter({ monjo: "drupp" });
        tree.update();

        expect(renderCount).toBe(2);
        expect(store.state.monjo).toBe("drupp");
        expect(tree.find('span')).toMatchInlineSnapshot(`
          <span>
            drupp
          </span>
        `);
      });

      it("should set parent state", async () => {
        const tree = mount(
          <Store initialState={{ funku: "wopple" }}>
            <Store initialState={{ nooma: "qurgu" }}>
              {({ state, set }) => {
                setter = set;

                return (
                  <div>
                    <span>{state.funku}</span>
                    <span>{state.nooma}</span>
                  </div>
                );
              }}
            </Store>
          </Store>
        );

        expect(tree.find('div')).toMatchInlineSnapshot(`
          <div>
            <span>
              wopple
            </span>
            <span>
              qurgu
            </span>
          </div>
        `);

        const updatedStore = await setter({ funku: "voombu" });
        tree.update();

        expect(tree.find('div')).toMatchInlineSnapshot(`
          <div>
            <span>
              voombu
            </span>
            <span>
              qurgu
            </span>
          </div>
        `);

        expect(updatedStore).toBePublicStore({
          data: {},
          state: {
            funku: "voombu",
            nooma: "qurgu",
          },
        });
      });

      it("should throw an exception trying to set value directly on state object", () => {
        let stateObj;

        mount(
          <Store tag="direct-set" initialState={{ aavn: "nort" }}>
            {({ state }) => { stateObj = state }}
          </Store>
        );

        expect(() => {
          stateObj.aavn = "zude";
        })
        .toThrow('Cannot set property "aavn" directly in state of Store "direct-set", use set() function instead.');
      });

      it("should throw an exception trying to set state on unmounted Store", () => {
        let setter;

        const tree = mount(
          <Container>
            <Store tag="unmounted-setter" initialState={{ hjork: "efurp" }}>
              {({ set }) => { setter = set }}
            </Store>
          </Container>
        );

        tree.find('Container').instance().setState({ mounted: false });

        expect(() => {
          setter({ hjork: "duppa" });
        })
        .toThrow('Cannot set state values on unmounted Store "unmounted-setter"');
      });
    });

    describe("reducing", () => {
      it("should not apply reducer at the initial rendering", () => {
        const tree = mount(
          <Store initialState={{ kamut: "brukwa", goffur: "enokh" }}
            controlStateChange={next => {
              if (next.kamut === "brukwa") {
                return { ...next, goffur: "adzo" };
              }

              return next;
            }}/>
        );

        expect(tree.find('Store').instance().store.state.goffur).toBe('enokh');
      });

      it("should call the reducer with correct arguments", async () => {
        const reducer = jest.fn(next => next);

        const tree = mount(
          <Store tag="parent" data={{ murt: "weck" }} initialState={{ awro: "vonk" }}>
            <Store tag="child" data={{ nuup: "sept" }}
              initialState={{ gwurf: "nork", drong: "xorp" }}
              controlStateChange={reducer} />
          </Store>
        );

        await tree.find('Store[tag="child"]').instance().set({ gwurf: "jupra" });

        const args = reducer.mock.calls[0];

        expect(args[0]).toEqual({
          gwurf: "jupra",
          drong: "xorp",
        });

        expect(args[1]).toBePublicStore({
          readOnly: true,
          data: {
            murt: "weck",
            nuup: "sept",
          },
          store: {
            awro: "vonk",
            gwurf: "mork",
            drong: "xorp",
          },
        });
      });

      it("should apply reducer when setting state", async () => {
        const tree = mount(
          <Store initialState={{ uyop: "refd", chuff: "mork" }}
            controlStateChange={next => {
              if (next.chuff === "mork") {
                return { ...next, uyop: "wujr" };
              }

              return next;
            }} />
        );

        const instance = tree.find('Store').instance();

        expect(instance.store.state.uyop).toBe("refd");

        const { state } = await instance.set({ uyop: 'arff' });

        expect(state.uyop).toBe('wujr');
        expect(instance.store.state.uyop).toBe('wujr');
      });

      describe("state change validation", () => {
        it("should throw an exception when controlStateChange returns an invalid value", async () => {
          let exception;

          const tree = mount(
            <Store tag="reducer" initialState={{ bugh: "mnik" }}
              controlStateChange={() => {}} />
          );

          try {
            await tree.find('Store').instance().set({ bugh: 'swuop' });

            exception = new Error("Exception should have been thrown!");
          }
          catch (e) {
            exception = e;
          }

          expect(exception.message).toBe(
            `controlStateChange function for Store "reducer" returned invalid value: ` +
            `undefined, expected an object with new state values.`
          );
        });

        it("should throw an exception when controlStateChange returns extra keys", async () => {
          let exception;

          const tree = mount(
            <Store tag="reducer" initialState={{ furp: "oolonk" }}
              controlStateChange={next => ({
                ...next,
                dorp: "afum",
                [Symbol('magun')]: "ionk",
              })} />
          );

          try {
            await tree.find('Store').instance().set({ furp: 'brank' });

            exception = new Error("Exception should have been thrown!");
          }
          catch (e) {
            exception = e;
          }

          expect(exception.message).toBe(
            `State change received from controlStateChange function for Store "reducer" ` +
            `includes invalid state keys "Symbol(magun)", "dorp" not present in the ` +
            `initial state. controlStateChange() cannot add new state keys.`
          );
        });
      });
    });

    describe("observing", () => {
      it("should not call onStateChange on initial rendering", () => {
        const observer = jest.fn();

        mount(
          <Store initialState={{ durg: "jmoo" }} onStateChange={observer}>
            {saveStore}
          </Store>
        );

        expect(store).toBePublicStore({ state: { durg: "jmoo" } });
        expect(observer).not.toHaveBeenCalled();
      });

      it("should call onStateChange handler on state change", async () => {
        let setter, args;

        const observer = jest.fn((...params) => { args = params; });

        mount(
          <Store data={{ bunz: "krunz" }} initialState={{ hfou: "zitz" }} onStateChange={observer}>
            {_store => {
              setter = _store.set;
              store = _store;
            }}
          </Store>
        );

        expect(store).toBePublicStore({
          data: { bunz: "krunz" },
          state: { hfou: "zitz" },
        });

        await setter({ hfou: "vroom" });

        expect(store).toBePublicStore({
          data: { bunz: "krunz" },
          state: { hfou: "vroom" },
        });

        expect(observer).toHaveBeenCalled();

        expect(args[0]).toBePublicStore({
          readOnly: true,
          data: { bunz: "krunz" },
          state: { hfou: "vroom" },
        });
      });
    });
  });

  describe("actions", () => {
    describe("root actions", () => {
      it("should throw an exception when trying to dispatch an action", () => {
        let dispatcher;

        // No owner store here!
        mount(
          <Bind>
            {({ dispatch }) => {
              dispatcher = dispatch;
            }}
          </Bind>
        );

        expect(() => {
          dispatcher('burgle', { erook: "qturxle" });
        })
        .toThrow('Cannot find handler for action "burgle". Arguments: [{"erook":"qturxle"}]');
      });
    });

    describe("action handlers", () => {
      let dispatch;

      beforeEach(() => {
        bork('error');
      });

      afterEach(() => {
        unbork('error');
        dispatch = null;
      });

      const Component = () => {
        const store = useStore();

        dispatch = store.dispatch;

        return null;
      };

      describe("dispatching", () => {
        it("should throw an exception if handler is not found", () => {
          mount(
            <Store actions={{ delp: () => { } }}>
              <Component />
            </Store>
          );

          expect(() => {
            dispatch('viyup');
          })
          .toThrow('Cannot find handler for action "viyup". Arguments: []');
        });

        describe("string named actions", () => {
          let value;

          const makeStore = () => {
            mount(
              <Store actions={{ nump: (_, arg) => { value = arg.borkle } }}>
                <Component />
              </Store>
            );
          };

          beforeEach(() => {
            value = null;
            makeStore();
          });

          it("should dispatch action by name", async () => {
            await dispatch('nump', { borkle: 'hloom' });

            expect(value).toBe('hloom');
          });

          it("should dispatch Redux style action", async () => {
            await dispatch({ type: 'nump', borkle: 'kabzon' });

            expect(value).toBe('kabzon');
          });
        });

        describe("Symbol named actions", () => {
          let value;
          const sym = Symbol('brunz');

          const makeStore = () => {
            mount(
              <Store actions={{ [sym]: () => { value = 'vuckle' } }}>
                <Component />
              </Store>
            );
          };

          beforeEach(() => {
            value = null;
            makeStore();
          });

          it("should dispatch action by name", async () => {
            await dispatch(sym);

            expect(value).toBe('vuckle');
          });

          it("should dispatch Redux style action", async () => {
            await dispatch({ type: sym });

            expect(value).toBe('vuckle');
          });
        });

        it("should cancel previous invocation of a handler if called within same event loop", async () => {
          let counter = 0;

          mount(
            <Store actions={{ increment: () => counter++ }}>
              <Component />
            </Store>
          );

          // Not awaiting for these dispatchers to test same loop invocation
          dispatch('increment');
          dispatch('increment');

          await sleep();

          expect(counter).toBe(1);
        });

        it("should cancel handler invocation(s) if Store is unmounted", async () => {
          let erup = 0,
            seng = 0;

          const tree = mount(
            <Container>
              <Store actions={{
                incrementErup: () => { ++erup },
                incrementSeng: () => { ++seng },
              }}>
                <Component />
              </Store>
            </Container>
          );

          dispatch('incrementErup');
          dispatch('incrementSeng');

          await sleep(10);

          expect(erup).toBe(1);
          expect(seng).toBe(1);

          dispatch('incrementErup');
          dispatch('incrementSeng');

          tree.find('Container').instance().setState({ mounted: false });
          tree.update();

          await sleep(50);

          expect(tree).toMatchInlineSnapshot(`
            <Container>
              <div>
                not mounted
              </div>
            </Container>
          `);

          expect(erup).toBe(1);
          expect(seng).toBe(1);
        });

        it("should pass public store and arguments to a handler", async () => {
          let store, args;

          mount(
            <Store actions={{
              klatz: (_store, ...params) => {
                store = _store;
                args = params;
              }
            }}>
              <Component />
            </Store>
          );

          await dispatch('klatz', 'munk', 'xroom');

          expect(store).toBePublicStore({});
          expect(args).toEqual(['munk', 'xroom']);
        });

        it("should climb up the parent chain to dispatch an action", async () => {
          let value, parentDispatch;

          mount(
            <Store actions={{ blerg: () => { value = 'kaputz' } }}>
              <div>
                <Bind>
                  {({ dispatch }) => {
                    parentDispatch = dispatch;

                    return (
                      <Store>
                        <Component />
                      </Store>
                    );
                  }}
                </Bind>
              </div>
            </Store>
          );

          await dispatch('blerg');

          expect(dispatch === parentDispatch).toBe(false);
          expect(value).toBe('kaputz');
        });

        it("action handler should return a Promise that is eventually resolved", async () => {
          mount(
            <Store actions={{
              gruddle: async (_, arg) => {
                await sleep(0);

                return { [arg]: true };
              }
            }}>
              <Component />
            </Store>
          );

          const promise = dispatch('gruddle', 'mundu');

          expect(promise instanceof Promise).toBe(true);

          const result = await promise;

          expect(result).toEqual({ mundu: true });
        });

        it("Promise returned by action handler should be rejected if synchronous handler throws an exception", async () => {
          const tree = mount(
            <ErrorBoundary>
              <Store actions={{ gangr: (_, arg) => { throw new Error(arg) } }}>
                <Component />
              </Store>
            </ErrorBoundary>
          );

          expect(tree).toMatchInlineSnapshot(`
            <ErrorBoundary>
              <Store
                actions={
                  Object {
                    "gangr": [Function],
                  }
                }
                data={Object {}}
                initialState={Object {}}
              >
                <Component />
              </Store>
            </ErrorBoundary>
          `);

          try {
            await dispatch('gangr', 'bzuurg!');

            // This should never be reached
            throw new Error('Handler did not throw exception');
          }
          catch (e) {
            expect(e.message).toBe('bzuurg!');
          }

          // Give it enough cycles to re-render
          tree.update();
          await sleep(10);

          expect(tree).toMatchInlineSnapshot(`
            <ErrorBoundary>
              <div>
                Error: bzuurg!
              </div>
            </ErrorBoundary>
          `);
        });

        it("Promise returned by action handler should be rejected if asynchronous handler throws an exception", async () => {
          const tree = mount(
            <ErrorBoundary>
              <Store actions={{
                wickle: async (_, arg) => {
                  await sleep(10);

                  throw new Error(arg);
                }
              }}>
                <Component />
              </Store>
            </ErrorBoundary>
          );

          expect(tree).toMatchInlineSnapshot(`
            <ErrorBoundary>
              <Store
                actions={
                  Object {
                    "wickle": [Function],
                  }
                }
                data={Object {}}
                initialState={Object {}}
              >
                <Component />
              </Store>
            </ErrorBoundary>
          `);

          const promise = dispatch('wickle', 'klapz?');

          try {
            await promise;

            // This should never be reached
            throw new Error('Handler did not throw exception');
          }
          catch (e) {
            expect(e.message).toBe('klapz?');
          }

          // Give it enough cycles to re-render
          await sleep(50);
          tree.update();

          expect(tree).toMatchInlineSnapshot(`
            <ErrorBoundary>
              <div>
                Error: klapz?
              </div>
            </ErrorBoundary>
          `);
        });
      });

      describe("anonymous actions", () => {
        it("should dispatch the handler function passed as action", async () => {
          let store;

          const action = _store => { store = _store };

          const tree = mount(
            <Store initialState={{ fhtagn: "r'lyeh" }} />
          );

          await tree.find('Store').instance().dispatch(action);

          expect(store).toBePublicStore({
            state: { fhtagn: "r'lyeh" }
          });
        });

        it("should pass the payload", async () => {
          let payload;

          const action = (_, ...args) => { payload = args };

          const tree = mount(
            <Store initialState={{ grokh: "wuru" }} />
          );

          await tree.find('Store').instance().dispatch(action, 'dromple', 'sedni');

          expect(payload).toEqual(['dromple', 'sedni']);
        });
      });

      describe("error handling", () => {
        it("should catch synchronous exception thrown in an action handler and rethrow it in the next render", async () => {
          let dispatcher;

          const tree = mount(
            <ErrorBoundary>
              <Store actions={{
                verr: () => {
                  throw new Error('qopp');
                }
              }}>
                {({ dispatch }) => {
                  dispatcher = dispatch;

                  return (
                    <div>
                      nguff
                    </div>
                  );
                }}
              </Store>
            </ErrorBoundary>
          );

          expect(tree).toMatchInlineSnapshot(`
            <ErrorBoundary>
              <Store
                actions={
                  Object {
                    "verr": [Function],
                  }
                }
                data={Object {}}
                initialState={Object {}}
              >
                <div>
                  nguff
                </div>
              </Store>
            </ErrorBoundary>
          `);

          try {
            await dispatcher('verr');

            throw new Error("Exception should have been thrown");
          }
          catch (e) {
            expect(e.message).toBe("qopp");
          }

          await sleep(10);

          tree.update();

          expect(tree).toMatchInlineSnapshot(`
            <ErrorBoundary>
              <div>
                Error: qopp
              </div>
            </ErrorBoundary>
          `);
        });

        it("should catch asynchronous exception thrown in an action handler and rethrow it in the next render", async () => {
          let dispatcher;

          const tree = mount(
            <ErrorBoundary>
              <Store actions={{
                kaffle: async () => {
                  await sleep(10);
                  throw new Error('gurp');
                }
              }}>
                {({ dispatch }) => {
                  dispatcher = dispatch;

                  return (
                    <div>
                      contle
                    </div>
                  );
                }}
              </Store>
            </ErrorBoundary>
          );

          expect(tree).toMatchInlineSnapshot(`
            <ErrorBoundary>
              <Store
                actions={
                  Object {
                    "kaffle": [Function],
                  }
                }
                data={Object {}}
                initialState={Object {}}
              >
                <div>
                  contle
                </div>
              </Store>
            </ErrorBoundary>
          `);

          try {
            await dispatcher('kaffle');

            throw new Error("Exception should have been thrown");
          }
          catch (e) {
            expect(e.message).toBe("gurp");
          }

          await sleep(10);

          tree.update();

          expect(tree).toMatchInlineSnapshot(`
            <ErrorBoundary>
              <div>
                Error: gurp
              </div>
            </ErrorBoundary>
          `);
        });
      });

      describe("setting state in action handlers", () => {
        const oldConsoleWarn = console.warn;
        const oldConsoleError = console.error;

        let warning = null;

        beforeEach(() => {
          console.warn = w => { warning = w; };
          console.error = jest.fn(() => { });
        });

        afterEach(() => {
          console.warn = oldConsoleWarn;
          console.error = oldConsoleError;
        });

        afterEach(() => {
          warning = null;
        });

        it("should throw an exception when called with invalid arguments", async () => {
          let setter;

          const tree = mount(
            <Store initialState={{ shurp: "jaax" }}
              actions={{ mroo: ({ set }) => { setter = set } }} />
          );

          await tree.find('Store').instance().dispatch('mroo');

          expect(() => {
            setter(["ridz", "epoc"]);
          }).toThrow('Invalid arguments: key/value object "["ridz","epoc"]"');
        });

        it("should allow setting multiple keys in own state", async () => {
          const sym = Symbol('iaaz');
          let setter, have;

          const tree = mount(
            <Store initialState={{ gaaf: "cerk", [sym]: ["pergle"] }}
              actions={{ fogh: ({ set }) => { setter = set } }}>
              {({ state }) => {
                // Cannot use merge() here, it skips symbol keys
                have = {
                  gaaf: state.gaaf,
                  [sym]: state[sym],
                };
              }}
            </Store>
          );

          expect(have).toEqual({
            gaaf: "cerk",
            [sym]: ["pergle"],
          });

          const want = {
            gaaf: "yurm",
            [sym]: { quez: "huuk" },
          };

          await tree.find('Store').instance().dispatch('fogh');

          await setter(want);

          expect(have).toEqual(want);
          expect(warning).toBe(null);
        });

        it("should allow setting keys in different Store owners", async () => {
          let setter, have;

          const tree = mount(
            <Store tag="parent" initialState={{ taal: ["oonz"] }}>
              <Store tag="child" initialState={{ wuuq: true, boork: null }}
                actions={{ vorp: ({ set }) => { setter = set } }}>
                {({ state }) => {
                  have = merge({}, state);
                }}
              </Store>
            </Store>
          );

          expect(have).toEqual({
            taal: ["oonz"],
            wuuq: true,
            boork: null,
          });

          const want = {
            taal: 193,
            wuuq: false,
            boork: undefined,
          };

          await tree.find('Store[tag="child"]').instance().dispatch('vorp');

          await setter(want);

          expect(have).toEqual(want);
        });

        it("should follow the order of parent to child Store when setting keys in different Stores", async () => {
          let have = [],
            setter;

          const tree = mount(
            <Store tag="gramps" initialState={{ gramps: "knutz" }}>
              {({ state: grampsState }) => {
                have.push({ ...grampsState });

                return (
                  <Store tag="parent" initialState={{ parent: "seap" }}>
                    {({ state: parentState }) => {
                      have.push({ ...parentState });

                      return (
                        <Store tag="child" initialState={{ child: "argu" }}
                          actions={{ sopple: ({ set }) => { setter = set } }}>
                          {({ state: childState }) => {
                            have.push({ ...childState });
                          }}
                        </Store>
                      );
                    }}
                  </Store>
                );
              }}
            </Store>
          );

          expect(have).toEqual([
            { gramps: 'knutz' },
            { parent: 'seap' },
            { child: 'argu' },
          ]);

          await tree.find('Store[tag="child"]').instance().dispatch('sopple');

          // Clear the array without changing reference
          have.length = 0;

          await setter({
            child: "hrum",
            parent: "enok",
            gramps: "aflo",
          });

          // Setting and rendering goes from grandparent to parent to child, respectively:
          // 
          // set(gramps, { gramps: 'aflo' }) ->
          //      renders gramps with { gramps: 'aflo' } (new value)
          //      renders parent with { parent: 'seap' } (still old value)
          //      renders child with { child: 'argu' } (still old value)
          // 
          // set(parent, { parent: 'enok' }) ->
          //      gramps is *not rendered*
          //      renders parent with { parent: 'enok' } (new value)
          //      renders child with { child: 'argu' } (still old value)
          //
          // set(child, { child: 'hrum' }) ->
          //      gramps is *not* rendered
          //      parent is *not rendered
          //      renders child with { child: 'hrum' } (new value)
          //
          expect(have).toEqual([
            { gramps: 'aflo' },
            { parent: 'enok' },
            { child: 'hrum' },
          ]);
        });

        it("should not attempt to set state on unmounted Store", async () => {
          let setter;

          const tree = mount(
            <Store tag="outer" initialState={{ mounted: true }}>
              {({ state }) => {
                if (state.mounted) {
                  return (
                    <Store tag="inner" initialState={{ wiffle: "fung" }}
                      actions={{ aufn: ({ set }) => { setter = set } }}>
                      {({ state }) => (
                        <div>
                          today's wiffle flavor: {state.wiffle}
                        </div>
                      )}
                    </Store>
                  )
                }

                return <div>no wiffle today :(</div>;
              }}
            </Store>
          );

          expect(tree.find('div')).toMatchInlineSnapshot(`
            <div>
              today's wiffle flavor: 
              fung
            </div>
            `);

          await tree.find('Store[tag="inner"]').instance().dispatch('aufn');

          await setter({ mounted: false });
          tree.update();
          await sleep(10);

          try {
            await setter({ wiffle: 'wuckleberry' });
          }
          catch (e) {
            expect(e instanceof StoreUnmountedError).toBe(true);
          }

          tree.update();
          await sleep(10);

          expect(tree.find('div')).toMatchInlineSnapshot(`
            <div>
              no wiffle today :(
            </div>
            `);

          expect(console.error).not.toHaveBeenCalled();
        });

        it("should throw an exception if key owner is not found", async () => {
          let setter;

          const tree = mount(
            <Store data={{ snek: "erop" }}
              actions={{ barum: ({ set }) => { setter = set } }} />
          );

          await tree.find('Store').instance().dispatch('barum');

          expect(() => {
            setter({ dhus: [1] });
          }).toThrow('Cannot find owner Store for key "dhus". You need to ' +
            'provide an initial value for this key in the "state" prop of the relevant Store.');
        });
      });

      describe("Store is unmounted while action handler is running", () => {
        it("should throw exception when trying to read from data", async () => {
          let exception;

          const tree = mount(
            <Container>
              <Store tag="unmount-read-data" data={{ hsa: "pukka" }}
                actions={{
                  trept: async ({ data }) => {
                    await sleep(10);

                    try {
                      // This assignment is for readability
                      // eslint-disable-next-line no-unused-vars
                      const hsa = data.hsa;

                      exception = new Error("Exception should have been thrown!");
                    }
                    catch (e) {
                      exception = e;
                    }
                  },
                }} />
            </Container>
          );

          // Do not await here! Timing is tricky.
          tree.find('Store').instance().dispatch('trept');

          // Action handlers fire in the next event loop, we need to give it
          // a chance to execute by yielding.
          await sleep();

          const container = tree.find('Container').instance();
          container.setState({ mounted: false });
          tree.update();

          await sleep(20);

          expect(exception instanceof StoreUnmountedError).toBe(true);
          expect(exception.message).toBe(
            'Cannot read value for property "hsa" from data of unmounted Store "unmount-read-data"'
          );
        });

        it("should throw exception when trying to read from state", async () => {
          let exception;

          const tree = mount(
            <Container>
              <Store tag="unmount-read-state" initialState={{ ghor: "drumple" }}
                actions={{
                  frucht: async ({ state }) => {
                    await sleep(10);

                    try {
                      // This assignment is for readability
                      // eslint-disable-next-line
                      const ghor = state.ghor;

                      exception = new Error("Exception should have been thrown!");
                    }
                    catch (e) {
                      exception = e;
                    }
                  },
                }} />
            </Container>
          );

          // Do not await here! Timing is tricky.
          tree.find('Store').instance().dispatch('frucht');

          // Action handlers fire in the next event loop, we need to give it
          // a chance to execute by yielding.
          await sleep();

          const container = tree.find('Container').instance();
          container.setState({ mounted: false });
          tree.update();

          await sleep(20);

          expect(exception instanceof StoreUnmountedError).toBe(true);
          expect(exception.message).toBe(
            'Cannot read value for property "ghor" from state of unmounted Store "unmount-read-state"'
          );
        });

        it("should throw exception in set", async () => {
          let exception, gdan;

          const tree = mount(
            <Container>
              <Store tag="unmount-set-state" initialState={{ gdan: "hjukk" }}
                actions={{
                  aippo: async ({ set }) => {
                    await sleep(10);

                    try {
                      set({ gdan: 'jupz' });

                      exception = new Error("Exception should have been thrown!");
                    }
                    catch (e) {
                      exception = e;
                    }
                  },
                }}>
                {({ state }) => { gdan = state.gdan }}
              </Store>
            </Container>
          );

          // Do not await here!
          tree.find('Store').instance().dispatch('aippo');

          await sleep();

          tree.find('Container').instance().setState({ mounted: false });
          tree.update();

          await sleep(10);

          expect(gdan).toBe('hjukk');
          expect(exception.message).toBe(
            'Cannot set state values on unmounted Store "unmount-set-state"'
          );
          expect(exception instanceof StoreUnmountedError).toBe(true);
        });

        it("should throw exception in dispatch", async () => {
          let exception;

          const tree = mount(
            <Container>
              <Store tag="unmount-dispatch" initialState={{ kerrle: "qtuff" }}
                actions={{
                  plyuk: async ({ dispatch }) => {
                    await sleep(10);

                    try {
                      await dispatch('zeppr');

                      exception = new Error("Exception should have been thrown!");
                    }
                    catch (e) {
                      exception = e;
                    }
                  },
                  zeppr: jest.fn(() => {}),
                }} />
            </Container>
          );

          const instance = tree.find('Store').instance();
          const zepprHandler = instance.props.actions.zeppr;
          expect(typeof zepprHandler).toBe('function');

          instance.dispatch('plyuk');

          await sleep();

          const container = tree.find('Container').instance();
          container.setState({ mounted: false });

          await sleep(10);

          expect(zepprHandler).not.toHaveBeenCalled();
          expect(exception.message).toBe(
            'Cannot dispatch actions on unmounted Store "unmount-dispatch"'
          );
          expect(exception instanceof StoreUnmountedError).toBe(true);
        });

        it("should reject the Promise returned from action handler if a generic error is thrown asynchronously", async () => {
          let exception, dispatcher, rendered;

          const tree = mount(
            <Container>
              <Store actions={{
                miang: async () => {
                  await sleep();

                  throw new Error("aflung!");
                }
              }}>
                {({ dispatch }) => {
                  rendered = true;
                  dispatcher = dispatch;
                }}
              </Store>
            </Container>
          );

          expect(rendered).toBe(true);

          const promise = dispatcher('miang');
          expect(promise instanceof Promise).toBe(true);

          // Give the handler time to fire
          await sleep();

          tree.find('Container').instance().setState({ mounted: false });

          try {
            await promise;

            exception = new Error("Exception should have been thrown!");
          }
          catch (e) {
            exception = e;
          }

          expect(exception.message).toBe("aflung!");
        });
      });
    });
  });

  describe("instance helpers", () => {
    it("should expose store object on instance", () => {
      const tree = mount(
        <Store data={{ rupple: "busp", nuff: "qwump" }} />
      );

      const instance = tree.find('Store').instance();

      expect(instance.store).toBePublicStore({
        data: {
          rupple: "busp",
          nuff: "qwump",
        },
        state: {},
      });
    });

    it("should expose set on instance", async () => {
      const tree = mount(
        <Store initialState={{ fuddle: "lutz" }}>
          {({ state: { fuddle } }) => (
            <div>
              {fuddle}
            </div>
          )}
        </Store>
      );

      expect(tree.find('div')).toMatchInlineSnapshot(`
        <div>
          lutz
        </div>
      `);

      const instance = tree.find('Store').instance();

      await instance.set({ fuddle: 'zuip' });
      tree.update();

      expect(tree.find('div')).toMatchInlineSnapshot(`
        <div>
          zuip
        </div>
      `);
    });

    it("should expose dispatch on instance", async () => {
      let value;

      const tree = mount(
        <Store initialState={{ hrump: "kukkle" }}
          actions={{
            mumz: ({ state }) => { value = state.hrump },
          }} />
      );

      await tree.find('Store').instance().dispatch('mumz');

      expect(value).toBe('kukkle');
    });
  });
});
