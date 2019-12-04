import React from 'react';
import { mount } from 'enzyme';

import ViewModel, { useBindings } from '../src';

describe("useBindings", () => {
    const oldConsoleError = console.error;
    
    beforeAll(() => {
        console.error = () => {};
    });

    afterAll(() => {
        console.error = oldConsoleError;
    });
    
    test("it should not allow invalid binding syntax", () => {
        const Component = () => {
            useBindings(null);
        };
        
        expect(() => {
            mount(<Component />);
        }).toThrow('Invalid bindings: null');
    });
    
    test("it should allow simplified binding syntax", () => {
        const Component = () => {
            const foo = useBindings('foo');

            return <div>{foo}</div>;
        };

        const tree = mount(
            <ViewModel data={{ foo: 'bar' }}>
                <Component />
            </ViewModel>
        );
        
        const cmp = tree.find('Component');
        
        expect(cmp).toMatchInlineSnapshot(`
            <Component>
              <div>
                bar
              </div>
            </Component>
        `);
    });
    
    test("it should allow array binding syntax", () => {
        const Component = () => {
            const [bar, baz] = useBindings(['bar', 'baz']);
            
            return <div>{bar} {baz}</div>;
        };
        
        const tree = mount(
            <ViewModel data={{ bar: "rab" }}>
                <ViewModel data={{ baz: "zab" }}>
                    <Component />
                </ViewModel>
            </ViewModel>
        );
        
        const cmp = tree.find('Component');
        
        expect(cmp).toMatchInlineSnapshot(`
            <Component>
              <div>
                rab
                 
                zab
              </div>
            </Component>
        `);
    });
    
    test("it should allow object binding syntax", () => {
        const Component = () => {
            const { value, setValue } = useBindings({ value: { key: 'qux', publish: true }});
            
            return <div>{value} {typeof setValue}</div>;
        };
        
        const tree = mount(
            <ViewModel initialState={{ qux: "jaf" }}>
                <Component />
            </ViewModel>
        );
        
        const cmp = tree.find('Component');
        
        expect(cmp).toMatchInlineSnapshot(`
            <Component>
              <div>
                jaf
                 
                function
              </div>
            </Component>
        `);
    });
    
    test("it should allow variadic binding syntax", () => {
        let setter;
        
        const Component = () => {
            const [kazoo, [blerg, setBlerg]] = useBindings('kazoo', ['blerg', true]);
            
            setter = setBlerg;
            
            return (
                <>
                    <div>kazoo: {kazoo}</div>
                    <div>blerg: {blerg}</div>
                </>
            );
        };
        
        const tree = mount(
            <ViewModel data={{ kazoo: 'plugh' }} initialState={{ blerg: 'throbbe' }}>
                <Component />
            </ViewModel>
        );
        
        let cmp = tree.find('Component');
        
        expect(cmp).toMatchInlineSnapshot(`
            <Component>
              <div>
                kazoo: 
                plugh
              </div>
              <div>
                blerg: 
                throbbe
              </div>
            </Component>
        `);
        
        setter("mymse");
        
        tree.mount();
        
        setTimeout(() => {
            cmp = tree.find('Component');
        
            expect(cmp).toMatchInlineSnapshot(`
                <Component>
                  <div>
                    kazoo: 
                    plugh
                  </div>
                  <div>
                    blerg: 
                    mymse
                  </div>
                </Component>
            `);
        }, 0);
    });
});
