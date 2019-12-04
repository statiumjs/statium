import { useContext } from 'react';

import { ViewModelContext } from './context';
import { multiGet } from './accessors';

export const useBindings = (..._bindings) => {
    const { vm } = useContext(ViewModelContext);
    
    return multiGet(vm, _bindings);
};
