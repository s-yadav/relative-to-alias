import {getTransformedCode} from '../src/util';
import { expect } from 'chai';

describe('Test transformation', () => {
  const aliasInfo = {
    alias: 'utils',
    aliasRelativeToRoot: 'src/utils'
  }

  const filePath = './src/component/modal/modal.js';

  function test(code, expected) {
    const newCode = getTransformedCode(filePath, code, aliasInfo);

    expect(newCode).to.equal(expected);
  }

  it('should transform single import to given alias', () => {
    const code  = `
      import common from '../../utils/common';
    `;

    const expected = `
      import common from 'utils/common';
    `;

    test(code, expected);
  });

  it('should transform require syntax to given alias', () => {
    const code  = `
      const common = require('../../utils/common');
    `;

    const expected = `
      const common = require('utils/common');
    `;

    test(code, expected);
  });

  it('should transform multiple imports / require to given alias', () => {
    const code  = `
      import React from 'react';
      import ajax from '../../utils/ajax';
      import layout, {hideScrollbar} from '../../utils/layout';
      const common = require('../../utils/common');
      import Button from '../forms/button';
    `;

    const expected = `
      import React from 'react';
      import ajax from 'utils/ajax';
      import layout, { hideScrollbar } from 'utils/layout';
      const common = require('utils/common');
      import Button from '../forms/button';
    `;

    test(code, expected);
  });

  it('should not update other part of the code', () => {
    const code  = `
      import common from '../../utils/common';

      function Modal() {
      const test='a';//it should not format this line
      }
    `;

    const expected = `
      import common from 'utils/common';

      function Modal() {
      const test='a';//it should not format this line
      }
    `;

    test(code, expected);
  });

  it('should handle leadingComments and trailingComments', () => {
    const code  = `
      //import common utils
      import common from '../../utils/common';
      //some other comment
    `;

    const expected = `
      //import common utils
      import common from 'utils/common';
      //some other comment
    `;

    test(code, expected);
  });

  it('should maintain quote type used in imports', () => {
    const code  = `
      import ajax from '../../utils/ajax';
      import layout, {hideScrollbar} from "../../utils/layout";
    `;

    const expected = `
      import ajax from 'utils/ajax';
      import layout, { hideScrollbar } from "utils/layout";
    `;

    test(code, expected);
  });

  it('should not affect require js pattern as that', () => {
    const code  = `
      require(['../../utils/ajax'], (ajax) => {
        ajax();
      });
    `;

    const expected  = null; //null means there is no changes

    test(code, expected);
  })
});
