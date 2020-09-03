import { useContext } from 'react';

import { Context } from './context.js';
import { expose } from './ViewController.js';

export const useController = () => {
    const { vc } = useContext(Context);
    
    return expose(vc);
};
