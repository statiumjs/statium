import React from 'react';
import { mount } from 'enzyme';
import sleep from './sleep.js';
import { bork, unbork } from './console.js';

import ViewModel, { Bind, ViewController, useController } from '../src';

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
                    { String(this.state.error) }
                </div>
            );
        }

        return this.props.children;
    }
}

describe("ViewController", () => {
    describe("root ViewController", () => {
        it("should throw an exception when trying to dispatch an event", () => {
            let dispatch;
            
            mount(
                <Bind controller>
                    { (_, { $dispatch }) => {
                        dispatch = $dispatch;
                    }}
                </Bind>
            );
            
            expect(() => {
                dispatch('burgle', { erook: "qturxle" });
            }).toThrow('Cannot find handler for event "burgle". Event arguments: ' +
                       '[{"erook":"qturxle"}]');
        });
    });
    
    describe("initialize", () => {
        it("should run initialize handler on first controller rendering", async () => {
            let foo;
            
            mount(
                <ViewController initialize={() => { foo = 'bar'; }} />
            );
            
            await sleep();
            
            expect(foo).toBe('bar');
        });
        
        it("should run initialize only once", async () => {
            let counter = 0;
            
            const tree = mount(
                <ViewController initialize={() => counter++} />
            );
            
            await sleep();
            
            expect(counter).toBe(1);
            
            tree.mount();
            
            await sleep();
            
            expect(counter).toBe(1);
        });
        
        it("should run initialize only once when ViewController is re-rendered before running initialize", async () => {
            let counter = 0;
            
            const tree = mount(
                <ViewController initialize={() => counter++} />
            );
            
            tree.mount();
            tree.mount();
            
            await sleep();
            
            expect(counter).toBe(1);
        });
    });
    
    describe("invalidate", () => {
        it("should not run invalidate handler on first controller rendering", async () => {
            let bar = 'baz';
            
            mount(
                <ViewController invalidate={() => { bar = "qux"; }} />
            );
            
            await sleep();
            
            expect(bar).toBe('baz');
        });
        
        it("should run invalidate handler on subsequent controller rendering", async () => {
            let blerg = 'throbbe';
            
            const tree = mount(
                <ViewController invalidate={() => { blerg = "plugh"; }} />
            );
            
            await sleep();
            
            expect(blerg).toBe("throbbe");
            
            tree.mount();
            
            await sleep();
            
            expect(blerg).toBe("plugh");
        });
    });

    describe("unmount", () => {
        let setter;

        const renderVC = async unmountFn => {
            const tree = mount(
                <ViewModel
                    data={{ promple: "duux", faasx: "poink", }}
                    initialState={{ mountVC: true }}>
                    <Bind props={[["mountVC", true]]}>
                    { ({ mountVC, setMountVC }) => {
                        setter = setMountVC;

                        return mountVC
                            ? <ViewController unmount={unmountFn} />
                            : null;
                    }}
                    </Bind>
                </ViewModel>
            );

            await sleep(0);

            return tree;
        };

        it("should fire when ViewController is unmounted", async () => {
            let unmounted;

            const tree = await renderVC(() => { unmounted = true; });
            
            setter(false);

            tree.update();
            await sleep();

            expect(unmounted).toBe(true);
        });

        it("should allow reading keys in unmount handler", async () => {
            let values;

            const tree = await renderVC(
                ({ $get }) => { values = $get('promple', 'faasx'); }
            );

            setter(false);
            tree.update();
            await sleep();

            expect(values).toEqual(["duux", "poink"]);
        });

        it("should not allow setting key value in unmount handler", async () => {
            let rendered, vcSetter;
            
            const tree = await renderVC(
                ({ $set }) => { rendered = true; vcSetter = $set; }
            );

            setter(false);
            tree.update();
            await sleep();

            expect(rendered).toBe(true);
            expect(typeof vcSetter).toBe('function');

            expect(() => {
                vcSetter("kwak", "quup");
            }).toThrow("Setting key values is not supported in unmount handler");
        });

        it("should not allow dispatching events in unmount handler", async () => {
            let rendered, vcDispatch;
            
            const tree = await renderVC(
                ({ $dispatch }) => { rendered = true; vcDispatch = $dispatch; }
            );

            setter(false);
            tree.update();
            await sleep();

            expect(rendered).toBe(true);
            expect(typeof vcDispatch).toBe('function');

            expect(() => {
                vcDispatch("iyump");
            }).toThrow("Dispatching events is not supported in unmount handler");
        });
    });

    
    describe("getters", () => {
        it("should return the value when called with one string key", () => {
            let value;
            
            mount(
                <ViewModel data={{ gurgle: "weenk" }}>
                    <ViewController>
                        <Bind controller>
                            { (_, { $get }) => {
                                value = $get('gurgle');
                            }}
                        </Bind>
                    </ViewController>
                </ViewModel>
            );
            
            expect(value).toBe('weenk');
        });
        
        it("should return the value when called with one symbol key", () => {
            const sym = Symbol('iippo');
            let value;
            
            mount(
                <ViewModel data={{ [sym]: "uppu" }}>
                    <ViewController>
                        <Bind controller>
                            { (_, { $get }) => {
                                value = $get(sym);
                            }}
                        </Bind>
                    </ViewController>
                </ViewModel>
            );
            
            expect(value).toBe('uppu');
        });
        
        it("should return array of values when called with variadic arguments", () => {
            let values;
            
            mount(
                <ViewModel data={{ hoat: "mickle", spuug: "afer" }} controller={{}}>
                    <Bind controller>
                        { (_, { $get }) => {
                            values = $get('hoat', 'spuug');
                        }}
                    </Bind>
                </ViewModel>
            );
            
            expect(values).toEqual(['mickle', 'afer']);
        });
        
        it("should return array of values when called with single array of keys", () => {
            let values;
            
            mount(
                <ViewModel data={{ juer: "lokh", qumpu: "fungle" }} controller={{}}>
                    <Bind controller>
                        { (_, { $get }) => {
                            values = $get(['juer', 'rinzo', 'qumpu']);
                        }}
                    </Bind>
                </ViewModel>
            );
            
            expect(values).toEqual(['lokh', undefined, 'fungle']);
        });
        
        it("should return an object with specified props when called with a single object of prop to key mappings (a la bindings)", () => {
            let values;
            
            mount(
                <ViewModel data={{ yutt: "xingle" }}
                    initialState={{ brint: ["agme"] }} controller={{}}>
                    <Bind controller>
                        { (_, { $get }) => {
                            values = $get({
                                value1: 'yutt',
                                value2: {
                                    key: 'brint',
                                    publish: true,
                                }
                            });
                        }}
                    </Bind>
                </ViewModel>
            );
            
            expect(typeof values.setValue2).toBe('function');
            delete values.setValue2;
            
            expect(values).toEqual({
                value1: 'xingle',
                value2: ['agme'],
            });
        });
    });
    
    describe("setters", () => {
        const oldConsoleWarn = console.warn;
        
        let warning = null;
        
        beforeAll(() => {
            console.warn = w => { warning = w; };
        });
        
        afterAll(() => {
            console.warn = oldConsoleWarn;
        });
        
        afterEach(() => {
            warning = null;
        });
        
        it("should throw an exception when called with invalid arguments", () => {
            let setter;
            
            mount(
                <ViewModel initialState={{ shurp: "jaax" }}>
                    <ViewController>
                        <Bind controller>
                            { (_, vc) => {
                                setter = vc.$set;
                            }}
                        </Bind>
                    </ViewController>
                </ViewModel>
            );
            
            expect(() => {
                setter(["ridz", "epoc"]);
            }).toThrow('Invalid arguments: key "["ridz","epoc"]", value: "undefined"');
        });
        
        it("should allow setting multiple keys in own state", async () => {
            const sym = Symbol('iaaz');
            let setter, have;
        
            mount(
                <ViewModel initialState={{
                        gaaf: "cerk",
                        [sym]: ["pergle"],
                    }}>
                    <ViewController>
                        <Bind props={['gaaf', sym]} controller>
                            { (values, { $set }) => {
                                have = values;
                                setter = $set;
                            }}
                        </Bind>
                    </ViewController>
                </ViewModel>
            );
            
            expect(have).toEqual({
                gaaf: "cerk",
                [sym]: ["pergle"],
            });
            
            const want = {
                gaaf: "yurm",
                [sym]: { quez: "huuk" },
            };
            
            await setter(want);
            
            expect(have).toEqual(want);
            expect(warning).toBe(null);
        });
        
        it("should allow setting keys in different ViewModel owners", async () => {
            let setter, have;
        
            mount(
                <ViewModel id="parent" initialState={{ taal: ["oonz"] }}>
                    <ViewModel id="child" initialState={{ wuuq: true, boork: null }}>
                        <ViewController>
                            <Bind props={['taal', 'wuuq', 'boork']} controller>
                                { (values, { $set }) => {
                                    have = values;
                                    setter = $set;
                                }}
                            </Bind>
                        </ViewController>
                    </ViewModel>
                </ViewModel>
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
            
            await setter(want);
            
            expect(have).toEqual(want);
        });
        
        it("should follow the order of parent to child ViewModel when setting keys in different ViewModels", async () => {
            let have = [],
                setter;
            
            mount(
                <ViewModel id="gramps" initialState={{ gramps: "knutz" }}>
                    <Bind props="gramps">
                        { grampValues => {
                            have.push(grampValues);
                            
                            return (
                                <ViewModel id="parent" initialState={{ parent: "seap" }}>
                                    <Bind props="parent">
                                        { parentValues => {
                                            have.push(parentValues);
                                            
                                            return (
                                                <ViewModel id="child"
                                                    initialState={{ child: "argu" }}>
                                                    <ViewController>
                                                        <Bind props="child" controller>
                                                            { (childValues, { $set }) => {
                                                                have.push(childValues);
                                                                setter = $set;
                                                            }}
                                                        </Bind>
                                                    </ViewController>
                                                </ViewModel>
                                            );
                                        }}
                                    </Bind>
                                </ViewModel>
                            );
                        }}
                    </Bind>
                </ViewModel>
            );
            
            expect(have).toEqual([
                { gramps: 'knutz' },
                { parent: 'seap' },
                { child: 'argu' },
            ]);
            
            // Clear the array without changing reference
            have.length = 0;
            
            await setter({
                child: "hrum",
                parent: "enok",
                gramps: "aflo",
            });
            
            // Setting and rendering goes from granparent to parent to child, respectively:
            // 
            // $set(gramps, { gramps: 'aflo' }) ->
            //      renders gramps with { gramps: 'aflo' } (new value)
            //      renders parent with { parent: 'seap' } (still old value)
            //      renders child with { child: 'argu' } (still old value)
            // 
            // $set(parent, { parent: 'enok' }) ->
            //      gramps is *not rendered*
            //      renders parent with { parent: 'enok' } (new value)
            //      renders child with { child: 'argu' } (still old value)
            //
            // $set(child, { child: 'hrum' }) ->
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
        
        it("should throw an exception if key owner is not found", () => {
            let setter;
            
            mount(
                <ViewModel data={{ snek: "erop" }}>
                    <ViewController>
                        <Bind controller>
                            { (_, { $set }) => {
                                setter = $set;
                            }}
                        </Bind>
                    </ViewController>
                </ViewModel>
            );
            
            expect(() => {
                setter('dhus', [1]);
            }).toThrow('Cannot find owner ViewModel for key dhus. You need to ' +
                       'provide initial value for this key in "initialState" prop.');
        });
        
        it("should dispatch correct event when setting value for a protected key", async () => {
            let value, setter;
            
            const setKatin = jest.fn(({ $set }, v) => {
                $set('katin', v);
            });
            
            const tree = mount(
                <ViewModel initialState={{ katin: "lau" }} protectedKeys="katin">
                    <ViewController handlers={{ setKatin }}>
                        <Bind props="katin" controller>
                        { ({ katin }, { $set }) => {
                            value = katin;
                            setter = $set;
                        }}
                        </Bind>
                    </ViewController>
                </ViewModel>
            );
            
            expect(value).toBe("lau");
            
            // Single-key invocation
            await setter("katin", "xana");
            
            tree.mount();
            await sleep();
            
            expect(setKatin.mock.calls).toHaveLength(1);
            expect(value).toBe("xana");
            
            // Multi-key invocation
            await setter({ katin: "koko" });
            
            tree.mount();
            await sleep();
            
            expect(setKatin.mock.calls).toHaveLength(2);
            expect(value).toBe("koko");
        });
        
        it("protected key handler should be able to set its own key directly but not other keys", async () => {
            let value, otherValue, setter;
            
            const setBurkle = jest.fn(({ $set }, v) => {
                $set({
                    burkle: v,
                    aahz: true,
                });
            });
            
            const setAahz = jest.fn(({ $set }, v) => {
                $set('aahz', 'value: ' + String(v));
            });
            
            const tree = mount(
                <ViewModel initialState={{ aahz: false, burkle: "juut" }}
                    protectedKeys={["aahz", "burkle"]}>
                    <ViewController handlers={{ setAahz, setBurkle }}>
                        <Bind props={["aahz", "burkle"]} controller>
                        { ({ aahz, burkle }, { $set }) => {
                            value = burkle;
                            otherValue = aahz;
                            setter = $set;
                        }}
                        </Bind>
                    </ViewController>
                </ViewModel>
            );
            
            expect(value).toBe("juut");
            expect(otherValue).toBe(false);
            
            await setter("burkle", "feng");
            
            tree.mount();
            await sleep();
            
            expect(setBurkle.mock.calls).toHaveLength(1);
            expect(setAahz.mock.calls).toHaveLength(1);
            expect(value).toBe("feng");
            expect(otherValue).toBe("value: true");
        });
    });
    
    describe("event handlers", () => {
        let dispatch;

        beforeEach(() => {
            bork('error');
        });
        
        afterEach(() => {
            unbork('error');
            dispatch = null;
        });
        
        const Component = () => {
            const controller = useController();
            
            dispatch = controller.$dispatch;
            
            return null;
        };
        
        it("ViewController should throw an exception if handler is not found", () => {
            mount(
                <ViewController handlers={{
                        foo: () => {},
                    }}>
                    <Component />
                </ViewController>
            );
            
            expect(() => {
                dispatch('bar');
            }).toThrow('Cannot find handler for event "bar". Event arguments: []');
        });
        
        it("should dispatch event to a handler", async () => {
            let value;
            
            mount(
                <ViewController handlers={{
                        baz: () => { value = 'hloom'; },
                    }}>
                    <Component />
                </ViewController>
            );
            
            dispatch('baz');
            
            await sleep();
            
            expect(value).toBe('hloom');
        });
        
        it("events with Symbol names shold work as expected", async () => {
            const sym = Symbol('brunz');
            let value;
            
            mount(
                <ViewController handlers={{
                        [sym]: () => { value = 'vuckle'; },
                    }}>
                    <Component />
                </ViewController>
            );
            
            dispatch(sym);
            
            await sleep();
            
            expect(value).toBe('vuckle');
        });
        
        it("should cancel previous invocation of a handler if called within same event loop", async () => {
            let counter = 0;
            
            mount(
                <ViewController handlers={{
                        increment: () => counter++,
                    }}>
                    <Component />
                </ViewController>
            );
            
            dispatch('increment');
            dispatch('increment');
            
            await sleep();
            
            expect(counter).toBe(1);
        });
        
        it("should cancel handler invocation(s) if ViewController is unmounted", async () => {
            let erup = 0,
                seng = 0;
            
            const tree = mount(
                <ViewController handlers={{
                        incrementErup: () => { ++erup; },
                        incrementSeng: () => { ++seng; },
                    }}>
                    <Component />
                </ViewController>
            );
            
            dispatch('incrementErup');
            dispatch('incrementSeng');
            
            tree.unmount();
            
            await sleep(50);
            
            expect(erup).toBe(0);
            expect(seng).toBe(0);
        });
        
        it("should pass ViewController and arguments to handler", async () => {
            let vc, args;
            
            mount(
                <ViewController handlers={{
                        klatz: (_vc, ...params) => {
                            vc = _vc;
                            args = params;
                        },
                    }}>
                    <Component />
                </ViewController>
            );
            
            dispatch('klatz', 'munk', 'xroom');
            
            await sleep();
            
            expect(Object.keys(vc)).toEqual(['$get', '$set', '$dispatch']);
            expect(args).toEqual(['munk', 'xroom']);
        });
        
        it("should climb up the parent chain to dispatch an event", async () => {
            let value, parentDispatch;
            
            mount(
                <ViewController handlers={{
                        blerg: () => { value = 'kaputz'; },
                    }}>
                    <ViewController>
                        <Bind controller>
                            { (_, vc) => {
                                parentDispatch = vc.$dispatch;
                                
                                return (
                                    <ViewController>
                                        <Component />
                                    </ViewController>
                                );
                            }}
                            </Bind>
                    </ViewController>
                </ViewController>
            );
            
            dispatch('blerg');
            await sleep();
            
            expect(dispatch === parentDispatch).toBe(false);
            expect(value).toBe('kaputz');
        });
        
        it("event handler should return a Promise that is eventually resolved", async () => {
            mount(
                <ViewController handlers={{
                        gruddle: async (vc, arg) => {
                            await sleep(0);
                            
                            return { [arg]: true };
                        },
                    }}>
                    
                    <Component />
                </ViewController>
            );
            
            const promise = dispatch('gruddle', 'mundu');
            
            expect(promise instanceof Promise).toBe(true);
            
            const result = await promise;
            
            expect(result).toEqual({ mundu: true });
        });
        
        it("Promise returned by event handler should be rejected if synchronous handler throws an exception", async done => {
            const tree = mount(
                <ErrorBoundary>
                    <ViewController handlers={{
                            gangr: (vc, arg) => {
                                throw new Error(arg);
                            },
                        }}>
                        
                        <Component />
                    </ViewController>
                </ErrorBoundary>
            );

            expect(tree).toMatchInlineSnapshot(`
                <ErrorBoundary>
                  <ViewController
                    handlers={
                      Object {
                        "gangr": [Function],
                      }
                    }
                  >
                    <Component />
                  </ViewController>
                </ErrorBoundary>
            `);
            
            try {
                await dispatch('gangr', 'bzuurg!');
                
                // This should never be reached
                done.fail('Handler did not throw exception');
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

            done();
        });

        it("Promise returned by event handler should be rejected if asynchronous handler throws an exception", async done => {
            const tree = mount(
                <ErrorBoundary>
                    <ViewController handlers={{
                            wickle: async (vc, arg) => {
                                await sleep(10);
                                
                                throw new Error(arg);
                            },
                        }}>
                        
                        <Component />
                    </ViewController>
                </ErrorBoundary>
            );
            
            expect(tree).toMatchInlineSnapshot(`
                <ErrorBoundary>
                  <ViewController
                    handlers={
                      Object {
                        "wickle": [Function],
                      }
                    }
                  >
                    <Component />
                  </ViewController>
                </ErrorBoundary>
            `);
            
            try {
                await dispatch('wickle', 'klapz?');
                
                // This should never be reached
                done.fail('Handler did not throw exception');
            }
            catch (e) {
                expect(e.message).toBe('klapz?');
            }

            // Give it enough cycles to re-render
            tree.update();
            await sleep(10);
            
            expect(tree).toMatchInlineSnapshot(`
                <ErrorBoundary>
                  <div>
                    Error: klapz?
                  </div>
                </ErrorBoundary>
            `);

            done();
        });
    });

    describe("error handling", () => {
        beforeAll(() => {
            bork('error');
        });
        
        afterAll(() => {
            unbork('error');
        });
        
        describe("default", () => {
            it("exception thrown in initializer should be rethrown in ViewControler render", async () => {
                const tree = mount(
                    <ErrorBoundary>
                        <ViewController initialize={() => {
                                throw new Error("futze!");
                            }}>
                            
                            <div>
                                blugg!
                            </div>
                        </ViewController>
                    </ErrorBoundary>
                );
                
                expect(tree).toMatchInlineSnapshot(`
                    <ErrorBoundary>
                      <ViewController
                        initialize={[Function]}
                      >
                        <div>
                          blugg!
                        </div>
                      </ViewController>
                    </ErrorBoundary>
                `);
                
                // Give it enough cycles to re-render
                await sleep(10);
                tree.update();
                
                expect(tree).toMatchInlineSnapshot(`
                    <ErrorBoundary>
                      <div>
                        Error: futze!
                      </div>
                    </ErrorBoundary>
                `);
            });
            
            it("exception thrown in invalidator should be rethrown in ViewControler render", async () => {
                const tree = mount(
                    <ErrorBoundary>
                        <ViewController invalidate={() => {
                                throw new Error("mpogh...");
                            }}>
                            
                            <div>
                                krunkle?
                            </div>
                        </ViewController>
                    </ErrorBoundary>
                );
                
                expect(tree).toMatchInlineSnapshot(`
                    <ErrorBoundary>
                      <ViewController
                        invalidate={[Function]}
                      >
                        <div>
                          krunkle?
                        </div>
                      </ViewController>
                    </ErrorBoundary>
                `);
                
                // This is a bit of a hack but we need to force-rerender the controller
                tree.find('ViewController').setState({ error: false });
                
                await sleep(10);
                tree.update();
                
                expect(tree).toMatchInlineSnapshot(`
                    <ErrorBoundary>
                      <div>
                        Error: mpogh...
                      </div>
                    </ErrorBoundary>
                `);
            });
            
            it("exception thrown in event handler should be rethrown in render", async done => {
                let dispatch;
                
                const tree = mount(
                    <ErrorBoundary>
                        <ViewController handlers={{
                                verr: () => {
                                    throw new Error('qopp');
                                },
                            }}>
                            
                            <Bind controller>
                            { (_, { $dispatch }) => {
                                dispatch = $dispatch;
                                
                                return (
                                    <div>
                                        nguff
                                    </div>
                                );
                            }}
                            </Bind>
                        </ViewController>
                    </ErrorBoundary>
                );
                
                expect(tree).toMatchInlineSnapshot(`
                    <ErrorBoundary>
                      <ViewController
                        handlers={
                          Object {
                            "verr": [Function],
                          }
                        }
                      >
                        <Bind
                          controller={true}
                        >
                          <div>
                            nguff
                          </div>
                        </Bind>
                      </ViewController>
                    </ErrorBoundary>
                `);
                
                try {
                    await dispatch('verr');

                    done.fail("Exception wasn't thrown");
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

                done();
            });
        });
    });
});
