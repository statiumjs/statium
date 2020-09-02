import { useContext } from 'react';

import { Context } from './context';
import { multiGet } from './accessors';

export const useBindings = (..._bindings) => {
    const { vm } = useContext(Context);
    
    return multiGet(vm, _bindings);
};
