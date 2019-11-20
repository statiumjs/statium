import React from 'react';
import { mount } from 'enzyme';

import { withBindings } from '../src';

describe('withBindings HOC', () => {
    test('it should return a valid wrapped component', () => {
        const Component = withBindings()(() => <div>foo</div>);

        const tree = mount(<Component />);

        expect(tree).toMatchInlineSnapshot(`
            <ComponentWithBindings>
              <Component>
                <div>
                  foo
                </div>
              </Component>
            </ComponentWithBindings>
        `);
    });
});
