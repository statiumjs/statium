import React from 'react';

import { ViewModelContext, ViewControllerContext } from './context';
import { normalizeBindings, mapProps } from './bindings';
import { expose } from './ViewController';

// Yes there's a prop named "props". Seemed the most apt name here ¯\_(ツ)_/¯
export const Bind = ({ props, controller, children }) => {
    const bindings = normalizeBindings(props, false);
    
    return (
        <ViewModelContext.Consumer>
            { ({ vm }) => !controller
                ? children(mapProps(vm, bindings))
                : <ViewControllerContext.Consumer>
                    { vc => children(mapProps(vm, bindings), expose(vc)) }
                  </ViewControllerContext.Consumer>
            }
        </ViewModelContext.Consumer>
    );
};
