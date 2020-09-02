import React from 'react';

import { Context } from './context';
import { normalizeBindings, mapProps } from './bindings';
import { expose } from './ViewController';

// Yes there's a prop named "props". Seemed the most apt name here ¯\_(ツ)_/¯
export const Bind = ({ props, controller, children }) => {
    const bindings = normalizeBindings(props, false);
    
    return (
        <Context.Consumer>
            { ({ vm, vc }) => !controller
                ? children(mapProps(vm, bindings))
                : children(mapProps(vm, bindings), expose(vc))
            }
        </Context.Consumer>
    );
};
