var postcss = require('postcss');
var Inherit = require('rework-inherit').Inherit;

module.exports = postcss.plugin('postcss-inherit', function (opts) {
    opts = opts || {};

    // Work with options here

    return function (css) {
      for (var i = 0; i < css.nodes.length; i++) {
        console.log(css.nodes[i].source);
      }
      return new Inherit(style, options || {})

    };
});
