var postcss = require('postcss');
var rework = require('rework');
var inherit = require('rework-inherit');
var parser = require('postcss/lib/parse');

module.exports = postcss.plugin('postcss-inherit', function (opts) {
    opts = opts || {};

  // Work with options here

    return function (css) {
        var inputCSS = css.source.input.css.trim();
        var outputCSS = rework(inputCSS).use(inherit(opts)).toString();
        return parser(outputCSS);

    };
});
