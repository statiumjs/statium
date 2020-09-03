import React from 'react';
import { mount } from 'enzyme';
import sleep from './sleep.js';

import ViewModel, { Bind } from '../src';
import { accessorType } from '../src/accessors.js';

const valueTester = want => 
    jest.fn(have => {
        expect(have).toEqual(want);
    });

describe("ViewModel component", () => {
    const oldConsoleError = console.error;
    
    beforeAll(() => {
        console.error = () => {};
    });
    
    afterAll(() => {
        console.error = oldConsoleError;
    });
    
    describe("data", () => {
        describe("own", () => {
            it("should allow binding to own data", () => {
                const data = {
                    foo: 'bar'
                };
                
                const tester = valueTester(data);
                
                mount(
                    <ViewModel data={data}>
                        <div>
                            <Bind props="foo">
                                { tester }
                            </Bind>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
        });
        
        describe("hierarchical", () => {
            it("should allow binding to inherited data", () => {
                const tester = valueTester({
                    bar: 'baz',
                    qux: 'moof',
                });
                
                mount(
                    <ViewModel data={{ bar: 'baz' }}>
                        <div>
                            <ViewModel data={{ qux: 'moof' }}>
                                <div>
                                    <Bind props={['bar', 'qux']}>
                                        { tester }
                                    </Bind>
                                </div>
                            </ViewModel>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
        });
    });
    
    describe("state", () => {
        describe("initializing", () => {
            it("should allow initializing state with an object", () => {
                const tester = valueTester({ blerg: 'knurf' });
                
                mount(
                    <ViewModel initialState={{ blerg: 'knurf' }}>
                        <div>
                            <Bind props="blerg">
                                { tester }
                            </Bind>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
            
            it("should allow initializing state with a function", () => {
                const tester = valueTester({ hloom: 'kazoo' });
                
                mount(
                    <ViewModel initialState={() => ({ hloom: "kazoo" })}>
                        <div>
                            <Bind props="hloom">
                                { tester }
                            </Bind>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
            
            it("should pass multi-getter to initialState function", () => {
                let values;
                
                mount(
                    <ViewModel data={{ krabbe: "dunz", byrge: "aax", }}>
                        <ViewModel initialState={$get => {
                            values = $get('krabbe', 'byrge');
                            
                            return {};
                        }} />
                    </ViewModel>
                );
                
                expect(values).toEqual(['dunz', 'aax']);
            });
            
            it("should throw an exception on invalid initialState", () => {
                expect(() => {
                    mount(
                        <ViewModel initialState={null} />
                    );
                }).toThrow(`Invalid initialState: null`);
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

                it("should warn when overriding own data key", () => {
                    mount(
                        <ViewModel id="yerp"
                            data={{ borkle: "dunz" }}
                            initialState={{ borkle: "zump" }} />
                    );

                    expect(console.warn).toHaveBeenCalledWith(
                        'initialState for ViewModel "yerp" contains key ' +
                        '"borkle" that overrides data key with similar name ' +
                        'provided by ViewModel "yerp".'
                    );
                });

                it("should warn when overriding parent data key", () => {
                    mount(
                        <ViewModel id="yupple" data={{ numbe: "worp" }}>
                            <ViewModel id="fungle"
                                initialState={{ numbe: "turp" }} />
                        </ViewModel>
                    );

                    expect(console.warn).toHaveBeenCalledWith(
                        'initialState for ViewModel "fungle" contains key ' +
                        '"numbe" that overrides data key with similar name ' +
                        'provided by ViewModel "yupple".'
                    );
                });

                it("should warn when overriding parent state key", () => {
                    mount(
                        <ViewModel id="jaffa" initialState={{ ryup: "vorp" }}>
                            <ViewModel id="inggo"
                                initialState={{ ryup: "mubble" }} />
                        </ViewModel>
                    );

                    expect(console.warn).toHaveBeenCalledWith(
                        'initialState for ViewModel "inggo" contains key ' +
                        '"ryup" that overrides another state key with ' +
                        'similar name provided by parent ViewModel "jaffa".'
                    );
                });
            });
        });
        
        // Getting own state is pretty much covered in "initializing" block above
        describe("getting", () => {
            describe("inherited state", () => {
                it("should allow getting inherited state", () => {
                    const tester = valueTester({
                        gurgle: 'throbbe',
                        mymse: 'puxx',
                    });
                
                    mount(
                        <ViewModel initialState={{ gurgle: "throbbe" }}>
                            <div>
                                <ViewModel initialState={() => ({ mymse: "puxx" })}>
                                    <div>
                                        <Bind props={['gurgle', 'mymse']}>
                                            { tester }
                                        </Bind>
                                    </div>
                                </ViewModel>
                            </div>
                        </ViewModel>
                    );
                
                    expect(tester).toHaveBeenCalled();
                });
            });
        });
        
        describe("modifying", () => {
            it("should call applyState modifier on rendering", () => {
                let state, getter, values, result;
                
                const applier = jest.fn((currentState, $get) => {
                    state = currentState;
                    getter = $get;
                    
                    values = $get('kunwa', 'mombo');
                    
                    return {
                        opptu: ["durp"],
                        fugh: "quipple",
                        runk: $get('kunwa'),
                    };
                });
                
                mount(
                    <ViewModel data={{ kunwa: "tyxi", mombo: "qwee" }}
                        initialState={{ opptu: "yarf" }}
                        applyState={applier}>
                        <Bind props={["kunwa", "opptu", "fugh", "runk"]}>
                            { props => {
                                result = props;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                expect(state).toEqual({
                    opptu: "yarf",
                });
                
                expect(typeof getter).toBe('function');
                expect(getter[accessorType]).toBe('get');
                
                expect(values).toEqual(['tyxi', 'qwee']);
                
                expect(result).toEqual({
                    kunwa: "tyxi",
                    opptu: ["durp"],
                    fugh: "quipple",
                    runk: "tyxi",
                });
            });
        });
        
        describe("observing", () => {
            it("should not call observeStateChange on initial rendering", () => {
                const observer = jest.fn();
                let result;
                
                mount(
                    <ViewModel initialState={{ durg: "jmoo" }} observeStateChange={observer}>
                        <Bind props="durg">
                            { values => {
                                result = values;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                expect(result).toEqual({
                    durg: "jmoo",
                });
                
                expect(observer).not.toHaveBeenCalled();
            });
            
            it("should call observeStateChange handler on state change", async () => {
                let result, setter, args;
                
                const observer = jest.fn((...params) => { args = params; });
                
                mount(
                    <ViewModel data={{ bunz: "krunz" }}
                        initialState={{ hfou: "zitz" }}
                        observeStateChange={observer}>
                        
                        <Bind props={{ value: { key: "hfou", publish: true }}}>
                            { ({ value, setValue }) => {
                                result = value;
                                setter = setValue;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                await setter("vroom");
                
                expect(result).toBe("vroom");
                expect(observer).toHaveBeenCalled();
                expect(args[0]).toEqual({
                    bunz: "krunz",
                    hfou: "vroom",
                });
                expect(typeof args[1]).toBe('function');
            });
        });
    });

    describe("controller", () => {
        it("should instantiate a ViewController when given controller config", async () => {
            let value, dispatch;
            
            mount(
                <ViewModel initialState={{ tyuf: "krankle" }}
                    controller={{
                        handlers: {
                            event: ({ $set }, v) => { $set('tyuf', v); },
                        },
                    }}>
                    <Bind props="tyuf" controller>
                        { ({ tyuf }, { $dispatch }) => {
                            value = tyuf;
                            dispatch = $dispatch;
                        }}
                    </Bind>
                </ViewModel>
            );
            
            expect(value).toBe("krankle");
            
            dispatch('event', 'nux');
            
            await sleep(10);
            
            expect(value).toBe('nux');
        });
        
        it("should instantiate a ViewController when given protectedKeys prop but no controller config", () => {
            let result, setter;
            
            mount(
                <ViewModel initialState={{ kaffle: "durk" }} protectedKeys="kaffle">
                    <Bind props={{ value: { key: 'kaffle', publish: true }}}>
                        { ({ value, setValue }) => {
                            result = value;
                            setter = setValue;
                        }}
                    </Bind>
                </ViewModel>
            );
            
            expect(result).toBe("durk");
            
            expect(() => {
                setter('cidu');
            }).toThrow('Cannot find handler for event "setKaffle". Event arguments: ["cidu"]');
        });
    });
    
    describe("protectedKeys", () => {
        let setter, result;
        
        afterEach(() => {
            setter = result = null;
        });
        
        describe("syntax", () => {
            describe("valid syntax types", () => {
                it("protected key can be a string", () => {
                    mount(
                        <ViewModel initialState={{ vurk: "yickle" }} protectedKeys="vurk">
                            <Bind props={{ value: { key: 'vurk', publish: true }}}>
                                { ({ setValue }) => {
                                    setter = setValue;
                                }}
                            </Bind>
                        </ViewModel>
                    );
            
                    expect(() => {
                        setter("burgle");
                    }).toThrow('Cannot find handler for event "setVurk". Event arguments: ["burgle"]');
                });
        
                it("protected key can be a Symbol, with specified event name", () => {
                    const sym = Symbol('ueke');
            
                    mount(
                        <ViewModel initialState={{ [sym]: "fagh" }} protectedKeys={{ [sym]: 'keueu' }}>
                            <Bind props={{ value: { key: sym, publish: true, setterName: 'setValue' }}}>
                                { ({ setValue }) => {
                                    setter = setValue;
                                }}
                            </Bind>
                        </ViewModel>
                    );
            
                    expect(() => {
                        setter({
                            hudd: "gbon"
                        });
                    }).toThrow('Cannot find handler for event "keueu". Event arguments: [{"hudd":"gbon"}]');
                });
        
                it("protected key can be a Symbol, with event name also being a Symbol", async () => {
                    const sym = Symbol('ktulu');
                    const event = Symbol('eerp');
            
                    mount(
                        <ViewModel initialState={{ [sym]: "fitz" }}
                            protectedKeys={{ [sym]: event }}
                            controller={{
                                handlers: {
                                    [event]: (vc, value) => { result = value; },
                                },
                            }}>
                            <Bind props={{ value: { key: sym, publish: true, setterName: 'setValue' }}}>
                                { ({ value, setValue }) => {
                                    result = value;
                                    setter = setValue;
                                }}
                            </Bind>
                        </ViewModel>
                    );
                    
                    setter("cyff");
                    
                    await sleep(10);
                    
                    expect(result).toBe("cyff");
                });
        
                it("protected keys can be an array", () => {
                    mount(
                        <ViewModel initialState={{ nuck: "saff" }} protectedKeys={['nuck']}>
                            <Bind props={{ nuck: { key: 'nuck', publish: true }}}>
                                { ({ setNuck }) => {
                                    setter = setNuck;
                                }}
                            </Bind>
                        </ViewModel>
                    );
            
                    expect(() => {
                        setter([0]);
                    }).toThrow('Cannot find handler for event "setNuck". Event arguments: [[0]]');
                });
        
                it("protected keys can be an object", () => {
                    mount(
                        <ViewModel initialState={{ lonto: "kuti" }} protectedKeys={{ lonto: "duff" }}>
                            <Bind props={[['lonto', true]]}>
                                { ({ setLonto }) => {
                                    setter = setLonto;
                                }}
                            </Bind>
                        </ViewModel>
                    );
            
                    expect(() => {
                        setter("ghon");
                    }).toThrow('Cannot find handler for event "duff". Event arguments: ["ghon"]');
                });
            });
            
            describe("invalid syntax", () => {
                const invalid = [undefined, null, 0, true, false, ''];
                
                // TODO Fuzzify this
                describe("simplified syntax", () => {
                    invalid.slice(2).forEach(option => {
                        it(`should throw on ${option}`, () => {
                            expect(() => {
                                mount(
                                    <ViewModel protectedKeys={option} />
                                );
                            }).toThrow(`Invalid protected keys: ${option}`);
                        });
                    });
                    
                    it("should throw when key is a Symbol but event is not specified", () => {
                        const sym = Symbol('kront');
                    
                        expect(() => {
                            mount(
                                <ViewModel protectedKeys={sym} />
                            );
                        }).toThrow('Protected key Symbol(kront) requires event name.');
                    });
                });
                
                describe("array syntax", () => {
                    [...invalid, []].forEach(option => {
                        it(`should throw on invalid key ${option}`, () => {
                            expect(() => {
                                mount(
                                    <ViewModel protectedKeys={[option]} />
                                );
                            }).toThrow(`Invalid protected key: ${option}`);
                        });
                        
                        it(`should throw on invalid key ${option} in object definition`, () => {
                            expect(() => {
                                mount(
                                    <ViewModel protectedKeys={[{ key: option }]} />
                                );
                            }).toThrow(`Invalid protected key: ${option}`);
                        });
                    });
                    
                    it("should throw on invalid key definition (object)", () => {
                        expect(() => {
                            mount(
                                <ViewModel protectedKeys={[{ hurf: "itzo" }]} />
                            );
                        }).toThrow(`Invalid protected key entry: {"hurf":"itzo"}`);
                    });
                });
                
                describe("object syntax", () => {
                    [...invalid.slice(0, invalid.length - 1)].forEach(option => {
                        it(`should throw on invalid event "${option}"`, () => {
                            expect(() => {
                                mount(
                                    <ViewModel protectedKeys={{ [option]: option }} />
                                );
                            }).toThrow(`Invalid event name for protected key "${option}": ${option}`);
                        });
                    });
                    
                    it("should throw on invalid event (empty string)", () => {
                        expect(() => {
                            mount(
                                <ViewModel protectedKeys={{ funto: '' }} />
                            );
                        }).toThrow(`Invalid event name for protected key "funto": ""`);
                    });
                    
                    it("should throw when key is a Symbol but event is not specified", () => {
                        const sym = Symbol('oof');
                    
                        expect(() => {
                            mount(
                                <ViewModel protectedKeys={[{ key: sym }]} />
                            );
                        }).toThrow('Protected key Symbol(oof) requires event name.');
                    });
                });
            });
        });
        
        describe("implementation", () => {
            it("should fire event in own controller when calling a setter for protected key", async () => {
                mount(
                    <ViewModel initialState={{ utun: "riggo" }}
                        protectedKeys="utun"
                        controller={{
                            handlers: {
                                setUtun: (vc, value) => { result = value; },
                            }
                        }}>
                        <Bind props={[['utun', true]]}>
                            { ({ setUtun }) => {
                                setter = setUtun;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                setter("vackle");
                
                await sleep(10);
                
                expect(result).toBe('vackle');
            });
            
            it("should fire event in parent controller when calling a setter for protected key", async () => {
                mount(
                    <ViewModel initialState={{ baff: "moow" }}
                        protectedKeys="baff"
                        controller={{
                            handlers: {
                                setBaff: (vc, value) => { result = value; },
                            },
                        }}>
                        <ViewModel initialState={{ ning: "sutt" }} controller={{}}>
                            <Bind props={[['baff', true]]}>
                                { ({ setBaff }) => {
                                    setter = setBaff;
                                }}
                            </Bind>
                        </ViewModel>
                    </ViewModel>
                );
                
                setter("junt");
                
                await sleep(10);
                
                expect(result).toBe('junt');
            });
            
            it("setting a value through controller handler should actually work", async () => {
                mount(
                    <ViewModel initialState={{ schmoo: "findus" }}
                        protectedKeys="schmoo"
                        controller={{
                            handlers: {
                                setSchmoo: ({ $set }, value) => { $set('schmoo', value); },
                            },
                        }}>
                        <Bind props={[['schmoo', true]]}>
                            { ({ schmoo, setSchmoo }) => {
                                result = schmoo;
                                setter = setSchmoo;
                            }}
                        </Bind>
                    </ViewModel>
                );
                
                expect(result).toBe("findus");
                
                setter("gurkle");
                
                await sleep();
                
                expect(result).toBe("gurkle");
            });
            
            it("setting a protected key value through ViewModel setter should expose " +
                 "protected $set to handler and avoid extra invocations", async () =>
            {
                let vmSetter, vcSetter, value;
                
                const mockSetter = jest.fn(({ $set }, dphun) => {
                    vcSetter = $set;
                    
                    return $set('dphun', dphun);
                });
                
                mount(
                    <ViewModel initialState={{ dphun: "smenk" }}
                        protectedKeys="dphun"
                        controller={{
                            handlers: {
                                setDphun: mockSetter,
                            },
                        }}>
                        
                        <Bind props={[["dphun", true]]}>
                        { ({ dphun, setDphun }) => {
                            value = dphun;
                            vmSetter = setDphun;
                            
                            return null;
                        }}
                        </Bind>
                    </ViewModel>
                );
                
                expect(value).toBe("smenk");
                
                vmSetter("qponk");
                
                await sleep(100);
                
                expect(vcSetter[accessorType]).toBe("protectedSet");
                expect(mockSetter.mock.calls).toHaveLength(1);
            });
        });
    });

    describe("instance methods", () => {
        it("should expose $get", () => {
            const tree = mount(
                <ViewModel data={{ rupple: "busp", nuff: "qwump" }} />
            );

            const instance = tree.find('ViewModel').instance();

            const [rupple, nuff] = instance.$get('rupple', 'nuff');

            expect(rupple).toBe('busp');
            expect(nuff).toBe('qwump');
        });

        it("should expose $set", async () => {
            const tree = mount(
                <ViewModel initialState={{ fuddle: "lutz" }}>
                    <Bind props="fuddle">
                    { ({ fuddle }) => (
                        <div>
                            { fuddle }
                        </div>
                    )}
                    </Bind>
                </ViewModel>
            );

            const instance = tree.find('ViewModel').instance();

            await instance.$set('fuddle', 'zuip');

            tree.update();
            await sleep();

            expect(tree.find('div')).toMatchInlineSnapshot(`
            <div>
              zuip
            </div>
            `);
        });

        it("should expose $dispatch", async () => {
            let value;

            const tree = mount(
                <ViewModel initialState={{ hrump: "kukkle" }}
                    controller={{
                        handlers: {
                            mumz: ({ $get }) => { value = $get('hrump'); },
                        },
                    }} />
            );

            const instance = tree.find('ViewModel').instance();

            await instance.$dispatch('mumz');

            expect(value).toBe('kukkle');
        });
    });
});
