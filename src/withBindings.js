import React from 'react';

import { Context } from './context';
import { normalizeBindings, mapProps } from './bindings';

export const withBindings = (...boundProps) => Component => {
    const bindings = normalizeBindings(boundProps, true);
    
    // Bound props come *last*, which bears the possibility of clobbering similar named
    // props passed to component from elsewhere. This tradeoff, however, is much better
    // from debugging standpoint than the other way around.
    const ComponentWithBindings = componentProps => (
        <Context.Consumer>
            { ({ vm }) => <Component {...componentProps} {...mapProps(vm, bindings)} /> }
        </Context.Consumer>
    );
    
    ComponentWithBindings.displayName =
        `withBindings(${Component.displayName || Component.name})`;

    return ComponentWithBindings;
};
