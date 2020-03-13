import React from 'react';
import { mount } from 'enzyme';

import ViewModel, { withBindings } from '../src';
import { accessorType } from '../src/accessors.js';

describe('withBindings HOC', () => {
    let values;
    
    beforeEach(() => {
        values = null;
    });
    
    const Component = props => {
        values = props;
        
        return <div>component</div>;
    };
    
    test('it should return a valid wrapped component', () => {
        const BoundComponent = withBindings()(Component);

        const tree = mount(<BoundComponent />);

        expect(tree).toMatchInlineSnapshot(`
            <ComponentWithBindings>
              <Component>
                <div>
                  component
                </div>
              </Component>
            </ComponentWithBindings>
        `);
    });
    
    test("variadic arguments should work", () => {
        const BoundComponent = withBindings('kramble', 'xyyf')(Component);
        
        mount(
            <ViewModel data={{ kramble: "dhak", xyyf: "ongo" }}>
                <BoundComponent />
            </ViewModel>
        );
        
        expect(values).toEqual({ kramble: "dhak", xyyf: "ongo" });
    });
    
    // Only test string keys as React does not support Symbol component props:
    // https://github.com/facebook/react/issues/7552 :(
    test("single string key binding should work", () => {
        const BoundComponent = withBindings('vuffle')(Component);
        
        mount(
            <ViewModel data={{ vuffle: "yunk" }}>
                <BoundComponent />
            </ViewModel>
        );
        
        expect(values).toEqual({ vuffle: "yunk" });
    });
    
    test("array form bindings should work", () => {
        const BoundComponent = withBindings(['tref', 'qmong'])(Component);
        
        mount(
            <ViewModel data={{ tref: 42, qmong: true }}>
                <BoundComponent />
            </ViewModel>
        );
        
        expect(values).toEqual({ tref: 42, qmong: true });
    });
    
    test("single binding in array form should work", () => {
        const BoundComponent = withBindings(['gurp', true])(Component);
        
        mount(
            <ViewModel initialState={{ gurp: "nomp" }}>
                <BoundComponent />
            </ViewModel>
        );
        
        expect(values.gurp).toBe("nomp");
        expect(typeof values.setGurp).toBe('function');
        expect(values.setGurp[accessorType]).toBe('set');
    });
    
    test("single binding in object form should work", () => {
        const BoundComponent = withBindings({
            dhuk: "krymp",
        })(Component);
        
        mount(
            <ViewModel data={{ krymp: "struff" }}>
                <BoundComponent />
            </ViewModel>
        );
        
        expect(values).toEqual({ dhuk: "struff" });
    });
});
