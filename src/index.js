import postcss from 'postcss';
import Inherit from './inherit';
/**
 * Public: PostCSS plugin allows you to inherit all the rules associated with a given selector.
 *
 * Returns a [PostCSS Plugin](http://api.postcss.org/postcss.html#.plugin) {Function}
 */
export default postcss.plugin('postcss-inherit',
  (opts = {}) =>
    (css) =>
      new Inherit(css, opts)
);
