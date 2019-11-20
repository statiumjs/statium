import React from 'react';
import { mount } from 'enzyme';

import ViewModel, { Bound } from '../src/ViewModel';

const valueTester = want => 
    jest.fn(have => {
        expect(have).toEqual(want);
    });

describe("binding", () => {
    describe("data", () => {
        describe("own", () => {
            test("ViewModel should allow binding to own data", () => {
                const data = {
                    foo: 'bar'
                };
                
                const tester = valueTester(data);
                
                mount(
                    <ViewModel data={data}>
                        <div>
                            <Bound props="foo">
                                { tester }
                            </Bound>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
        });
        
        describe("hierarchical", () => {
            test("ViewModel should allow binding to inherited data", () => {
                const tester = valueTester({
                    bar: 'baz',
                    qux: 'moof',
                });
                
                mount(
                    <ViewModel data={{ bar: 'baz' }}>
                        <div>
                            <ViewModel data={{ qux: 'moof' }}>
                                <div>
                                    <Bound props={['bar', 'qux']}>
                                        { tester }
                                    </Bound>
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
            test("ViewModel should allow initializing state with an object", () => {
                const tester = valueTester({ blerg: 'knurf' });
                
                mount(
                    <ViewModel initialState={{ blerg: 'knurf' }}>
                        <div>
                            <Bound props="blerg">
                                { tester }
                            </Bound>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
            
            test("ViewModel should allow initializing state with a function", () => {
                const tester = valueTester({ hloom: 'kazoo' });
                
                mount(
                    <ViewModel initialState={() => ({ hloom: "kazoo" })}>
                        <div>
                            <Bound props="hloom">
                                { tester }
                            </Bound>
                        </div>
                    </ViewModel>
                );
                
                expect(tester).toHaveBeenCalled();
            });
        });
        
        // Getting own state is pretty much covered in "initializing" block above
        describe("getting", () => {
            describe("inherited state", () => {
                test("ViewModel should allow getting inherited state", () => {
                    const tester = valueTester({
                        gurgle: 'throbbe',
                        mymse: 'puxx',
                    });
                
                    mount(
                        <ViewModel initialState={{ gurgle: "throbbe" }}>
                            <div>
                                <ViewModel initialState={() => ({ mymse: "puxx" })}>
                                    <div>
                                        <Bound props={['gurgle', 'mymse']}>
                                            { tester }
                                        </Bound>
                                    </div>
                                </ViewModel>
                            </div>
                        </ViewModel>
                    );
                
                    expect(tester).toHaveBeenCalled();
                });
            });
        });
        
        describe("setting", () => {
            describe("own state", () => {
                test("ViewModel should allow setting own state", done => {
                    const values = {};
                    
                    mount(
                        <ViewModel initialState={{ jakk: "chung" }}>
                            <Bound props={[{ prop: 'jakk', key: 'jakk', publish: true }]}>
                                { bound => { Object.assign(values, bound); }}
                            </Bound>
                        </ViewModel>
                    );
                    
                    expect(values.jakk).toBe('chung');
                    expect(typeof values.setJakk).toBe('function');
                    
                    values.setJakk('mung');
                    
                    // Need to break out of the event loop for ViewModel to get re-rendered
                    setTimeout(() => {
                        expect(values.jakk).toBe('mung');
                        expect(typeof values.setJakk).toBe('function');
                        done();
                    }, 0);
                });
            });
            
            describe("inherited state", () => {
                test("ViewModel should allow setting inherited state", done => {
                    const values = {};
                
                    mount(
                        <ViewModel initialState={{ durg: "wuygu" }}>
                            <div>
                                <ViewModel initialState={{ aummo: "roiq" }}>
                                    <div>
                                        <Bound props={[
                                                { prop: 'value', key: 'durg', publish: true }
                                            ]}>
                                            { bound => { Object.assign(values, bound); }}
                                        </Bound>
                                    </div>
                                </ViewModel>
                            </div>
                        </ViewModel>
                    );
                
                    expect(values.value).toBe('wuygu');
                    expect(typeof values.setValue).toBe('function');
                
                    values.setValue('klatz');
                
                    setTimeout(() => {
                        expect(values.value).toBe('klatz');
                        expect(typeof values.setValue).toBe('function');
                        done();
                    }, 0);
                });
            });
            
            describe("after parent re-render", () => {
                test("setting state should work after parent component re-mount", done => {
                    const data = { pharg: "nix" };
                    const values = {};
                    
                    const tree = mount(
                        <ViewModel data={data} initialState={{ vroom: "qrux" }}>
                            <Bound props={{
                                    value: {
                                        key: "vroom",
                                        publish: true
                                    },
                                    pharg: "pharg",
                                }}>
                                { bound => { Object.assign(values, bound); }}
                            </Bound>
                        </ViewModel>
                    );
                    
                    expect(values.pharg).toBe("nix");
                    expect(values.value).toBe("qrux");
                    expect(typeof values.setValue).toBe('function');
                    
                    data.pharg = "nux";
                    tree.mount();
                    
                    setTimeout(() => {
                        expect(values.pharg).toBe("nux");
                        expect(values.value).toBe("qrux");
                        expect(typeof values.setValue).toBe('function');
                        
                        expect(() => {
                            values.setValue("brak");
                        }).not.toThrow();
                        
                        setTimeout(() => {
                            expect(values.pharg).toBe("nux");
                            expect(values.value).toBe("brak");
                            expect(typeof values.setValue).toBe('function');
                            
                            done();
                        }, 0);
                    }, 0);
                });
            });
        });
    });
});
