import React from 'react';
import { mount } from 'enzyme';

import Store, { Bind } from '../src';

describe("Bind component", () => {
  it("should allow binding to public Store API", () => {
    let have;

    mount(
      <Store data={{ flerg: "xufn" }} initialState={{ asud: "jhor" }}>
        <div>
          <Bind>
            {store => { have = store }}
          </Bind>
        </div>
      </Store>
    );

    expect(have).toBePublicStore({
      data: { flerg: "xufn" },
      state: { asud: "jhor" },
    });
  });
});
