import React from 'react';

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
    error(`Failed to set key "${key}", no ViewModel found. Value: ${JSON.stringify(value)}`);
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
    $retrieve: key => rootViewModel.$get(key),
    $dispatch: defaultDispatch,
};

export const rootViewController = {
    $get: rootViewModel.$retrieve,
    $set: rootViewModel.$set,
    $dispatch: defaultDispatch,
};

export const ViewModelContext = React.createContext({ vm: rootViewModel });
export const ViewControllerContext = React.createContext(rootViewController);
