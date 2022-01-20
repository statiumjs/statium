import { Store } from './Store.js';
import { StoreUnmountedError } from './context.js';
import { Bind } from './Bind.js';
import { bind } from './bindHoc.js';
import { useStore, useState } from './hooks.js';

Store.StoreUnmountedError = StoreUnmountedError;
Store.Bind = Bind;
Store.bind = bind;
Store.useStore = useStore;
Store.useState = useState;

export {
  Store as default,
  StoreUnmountedError,
  Bind,
  bind,
  useStore,
  useState,
};
