import React from 'react';
import { mount } from 'enzyme';
import Store, { Bind, bind, useStore, useState, StoreUnmountedError } from '../src/index.js';

describe("exports", () => {
  it("should export Store component", () => {
    const tree = mount(<Store />);

    expect(tree).toMatchInlineSnapshot(`
      <Store
        data={Object {}}
        initialState={Object {}}
      />
    `);
  });

  it("should export Bind component", () => {
    const tree = mount(<Bind>{() => {}}</Bind>);

    expect(tree).toMatchInlineSnapshot(`<Bind />`);
  });

  it("should export bind() HOC", () => {
    let have;

    const Component = ({ foo }) => {
      have = foo;
      return null;
    };
    const Cmp = bind({ foo: ({ state }) => state.foo })(Component);

    const tree = mount(
      <Store initialState={{ foo: 'bar' }}>
        <Cmp />
      </Store>
    );

    expect(have).toBe('bar');
    expect(tree).toMatchInlineSnapshot(`
      <Store
        data={Object {}}
        initialState={
          Object {
            "foo": "bar",
          }
        }
      >
        <bind(Component)>
          <Component
            foo="bar"
          />
        </bind(Component)>
      </Store>
    `);
  });

  it("should export useStore hook", () => {
    let store;

    const Component = () => {
      store = useStore();

      return null;
    };

    const tree = mount(
      <Store>
        <Component />
      </Store>
    );

    expect(tree).toMatchInlineSnapshot(`
      <Store
        data={Object {}}
        initialState={Object {}}
      >
        <Component />
      </Store>
    `);

    expect(store).toBePublicStore({
      data: {},
      state: {},
    });
  });

  it("should export useState hook", () => {
    let have;

    const Component = () => {
      const [blerg] = useState('kryngo');
      have = blerg;

      return null;
    };

    mount(
      <Store>
        <Component />
      </Store>
    );

    expect(have).toBe('kryngo');
  });

  it("should export StoreUnmountedError", () => {
    expect(typeof StoreUnmountedError).toBe('function');
    expect((new StoreUnmountedError()).isStoreUnmounted).toBe(true);
  });
});

describe("sub-exports via Store class static properties", () => {
  it("should have Store.Bind property for Bind component", () => {
    const tree = mount(<Store.Bind>{ () => {} }</Store.Bind>);

    expect(tree).toMatchInlineSnapshot(`<Bind />`);
  });

  it("should have Store.bind property for bind HOC", () => {
    const Component = () => null;
    const Cmp = Store.bind(() => {})(Component);

    const tree = mount(
      <Store>
        <Cmp />
      </Store>
    );

    expect(tree).toMatchInlineSnapshot(`
      <Store
        data={Object {}}
        initialState={Object {}}
      >
        <bind(Component)>
          <Component />
        </bind(Component)>
      </Store>
    `);
  });

  it("should have Store.useStore property for useStore hook", () => {
    let store;

    const Component = () => {
      store = Store.useStore();

      return null;
    };

    const tree = mount(
      <Store>
        <Component />
      </Store>
    );

    expect(tree).toMatchInlineSnapshot(`
      <Store
        data={Object {}}
        initialState={Object {}}
      >
        <Component />
      </Store>
    `);

    expect(store).toBePublicStore({
      data: {},
      state: {},
    });
  });

  it("should have Store.useState property for useState hook", () => {
    let have;

    const Component = () => {
      const [fruj] = Store.useState('lopt');
      have = fruj;

      return null;
    };

    mount(
      <Store>
        <Component />
      </Store>
    );

    expect(have).toBe('lopt');
  });

  it("should have Store.StoreUnmountedError for StoreUnmountedError", () => {
    expect(typeof Store.StoreUnmountedError).toBe('function');
    expect((new Store.StoreUnmountedError()).isStoreUnmounted).toBe(true);
  });
});
