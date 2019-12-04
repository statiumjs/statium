import { useContext } from 'react';

import { ViewControllerContext } from './context';

export const useController = () => {
    const vc = useContext(ViewControllerContext);
    
    return { $get: vc.$get, $set: vc.$set, $dispatch: vc.$dispatch };
};
