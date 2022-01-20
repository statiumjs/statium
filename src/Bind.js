import React from 'react';

import { Context } from './context.js';

export const Bind = ({ children }) =>
  React.createElement(Context.Consumer, null, ({ store }) => children(store.fullAPI));
