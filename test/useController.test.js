import React from 'react';
import { mount } from 'enzyme';

import { ViewController, useController } from '../src';

describe("useController", () => {
    test("it should bind to ViewController instance", () => {
        let controller;
        
        const Component = () => {
            controller = useController();
            
            return null;
        };
        
        mount(
            <ViewController>
                <Component />
            </ViewController>
        );
        
        expect(Object.keys(controller)).toEqual(['$get', '$set', '$dispatch']);
        expect(typeof controller.$get).toBe('function');
        expect(typeof controller.$set).toBe('function');
        expect(typeof controller.$dispatch).toBe('function');
    });
});
