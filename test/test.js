var postcss = require('postcss');
var expect  = require('chai').expect;
var fs = require('fs');

var inherit = require('../');

function read(file) {
    return fs.readFileSync('./test/fixtures/' + file + '.css', 'utf8');
}

var test = function (input, output, opts, done) {
    postcss([ inherit(opts) ]).process(input).then(function (result) {
        expect(result.css.trim()).to.eql(output.trim());
        expect(result.warnings()).to.be.empty;
        done();
    }).catch(function (error) {
        done(error);
    });
};

describe('postcss-inherit', function () {

    it('should handle attribute selectors', function(done){
        test(read('attribute').trim(), read('attribute.out').trim(), {}, done);
    });
    it('should clearfix', function(done){
        test(read('clearfix'), read('clearfix.out'), {}, done);
    });
    it('should clearfix zoom', function(done){
        test(read('clearfix.zoom'), read('clearfix.zoom.out'), {}, done);
    });
    it('should combine inherits', function(done){
        test(read('combined'), read('combined.out'), {}, done);
    });
    it('should inherit through media', function(done){
        test(read('media'), read('media.out'), {}, done);
    });
    it('should inherit disjoint media', function(done){
        test(read('media'), read('media.out'), {}, done);
    });
    it('should inherit substring', function(done){
        test(read('substring'), read('substring.out'), {}, done);
    });
    it('should inherit multiple selectors', function(done){
        test(read('multiple'), read('multiple.out'), {}, done);
    });
    it('should inherit a tag', function(done){
        test(read('tag'), read('tag.out'), {}, done);
    });
    it('should chain inheritance', function(done){
        test(read('chain'), read('chain.out'), {}, done);
    });
    it('should inherit out of order', function(done){
        test(read('unordered'), read('unordered.out'), {}, done);
    });
    it('should sequence inheritance (e.g. .one.two%three)', function(done){
        test(read('sequence'), read('sequence.out'), {}, done);
    });
    it('should sequence complex inheritance (e.g. .one.two%three)', function(done){
        test(read('complex-sequence'), read('complex-sequence.out'), {}, done);
    });
    it('should Extend regexp', function(done){
        test(read('extend'), read('chain.out'), {propertyRegExp: /^extends?$/}, done);
    });

});
