import postcss from 'postcss';
import Inherit from './inherit';

export default postcss.plugin('postcss-inherit',
  (opts = {}) =>
    (css) =>
      new Inherit(css, opts)
);
