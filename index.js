var postcss = require('postcss');
var rework = require('rework');
var inherit = require('rework-inherit');
var parse = require('postcss/lib/parse');

module.exports = postcss.plugin('postcss-inherit', function (opts) {
    opts = opts || {};

  // Work with options here

    return function (css) {
        var inputCSS = css.toString();
        var outputCSS = rework(inputCSS).use(inherit(opts)).toString();
        return parse(outputCSS);
    };
});
