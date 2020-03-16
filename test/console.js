const cnsl = {
    log: console.log,
    warn: console.warn,
    error: console.error,
};

export const bork = what => {
    console[what] = () => {};
};

export const unbork = what => {
    console[what] = cnsl[what];
};
