import React from 'react';

export class ViewModelUnmountedError extends Error {
    constructor(...args) {
        super(...args);

        this.isViewModelUnmounted = true;
    }
}

const error = msg => {
    if (process.env.NODE_ENV === 'production') {
        console.error(msg);
    }
    else {
        throw new Error(msg);
    }
};

const defaultGet = key => {
    error(`Failed to retrieve a value for key "${key}", no ViewModel found`);
};

const defaultSet = (key, value) => {
    if (typeof key === 'object') {
        const keys = Object.keys(key).map(k => `"${String(k)}"`).join(', ');

        error(`Failed to set keys: ${keys}; no ViewModel found.`);
    }
    else {
        error(`Failed to set key "${key}", no ViewModel found. Value: ${JSON.stringify(value)}`);
    }
};

const defaultDispatch = (event, ...payload) => {
    error(`Cannot find handler for event "${event}". Event arguments: ${JSON.stringify(payload)}`);
};

export const rootViewModel = {
    formulas: {},
    data: {},
    state: {},
    store: {},
    $get: defaultGet,
    $set: defaultSet,
    $resolveValue: key => rootViewModel.$get(key),
    $dispatch: defaultDispatch,
};

export const rootViewController = {
    vm: rootViewModel,
    $get: rootViewModel.$retrieve,
    $set: rootViewModel.$set,
    $dispatch: defaultDispatch,
};

const _StatiumContext = Symbol('StatiumContext');

// One often encountered problem is package being included more than once
// in the application bundle, due to bundler misconfiguration or some other
// reason. If that happens, each copy of the Statium package will have its own
// pair of private ViewModel and ViewController contexts; this will lead to
// _seriously_ hairy bugs that are really hard to track.
// To avoid this issue, we simply cache context objects in the window.
export const Context = (() => {
    let context;
    
    try {
        if (window[_StatiumContext]) {
            context = window[_StatiumContext];
        }
        else {
            throw new Error('No context');
        }
    }
    catch (e) {
        context = React.createContext({
            vm: rootViewModel,
            vc: rootViewController,
        });

        window[_StatiumContext] = context;
    }
    
    return context;
})();
