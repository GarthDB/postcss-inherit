/* eslint-disable no-unused-expressions */
import postcss from 'postcss';
import chai from 'chai';
import fs from 'fs';
import importAt from 'postcss-import';

const expect = chai.expect;

import inherit from '../src/index';

function read(file) {
  return fs.readFileSync(`./test/fixtures/${file}.css`, 'utf8');
}

function test(input, output, opts, done) {
  postcss([inherit(opts)]).process(input).then((result) => {
    expect(result.css.trim()).to.eql(output.trim());
    expect(result.warnings()).to.be.empty;
    done();
  })
  .catch((error) => {
    done(error);
  });
}

describe('postcss-inherit', () => {
  it('should handle a placeholder', (done) => {
    test(read('placeholder').trim(), read('placeholder.out').trim(), {}, done);
  });
  it('should handle attribute selectors', (done) => {
    test(read('attribute').trim(), read('attribute.out').trim(), {}, done);
  });
  it('should clearfix', (done) => {
    test(read('clearfix'), read('clearfix.out'), {}, done);
  });
  it('should clearfix zoom', (done) => {
    test(read('clearfix.zoom'), read('clearfix.zoom.out'), {}, done);
  });
  it('should combine inherits', (done) => {
    test(read('combined'), read('combined.out'), {}, done);
  });
  it('should inherit through media', (done) => {
    test(read('media'), read('media.out'), {}, done);
  });
  it('should inherit disjoint media', (done) => {
    test(read('media'), read('media.out'), {}, done);
  });
  it('should inherit substring', (done) => {
    test(read('substring'), read('substring.out'), {}, done);
  });
  it('should inherit multiple selectors', (done) => {
    test(read('multiple'), read('multiple.out'), {}, done);
  });
  it('should inherit a tag', (done) => {
    test(read('tag'), read('tag.out'), {}, done);
  });
  it('should chain inheritance', (done) => {
    test(read('chain'), read('chain.out'), {}, done);
  });
  it('should inherit out of order', (done) => {
    test(read('unordered'), read('unordered.out'), {}, done);
  });
  it('should sequence inheritance (e.g. .one.two%three)', (done) => {
    test(read('sequence'), read('sequence.out'), {}, done);
  });
  it('should sequence complex inheritance (e.g. .one.two%three)', (done) => {
    test(read('complex-sequence'), read('complex-sequence.out'), {}, done);
  });
  it('should Extend regexp', (done) => {
    test(read('extend'), read('chain.out'), { propertyRegExp: /^extends?$/ }, done);
  });
  it('should extend a class', (done) => {
    test(read('class'), read('class.out'), {}, done);
  });
  it('should work after another plugin', (done) => {
    const inputcss = read('import');
    const expectedOutput = read('import.out');
    postcss([importAt(), inherit()]).process(inputcss).then((result) => {
      expect(result.css.trim()).to.eql(expectedOutput.trim());
      expect(result.warnings()).to.be.empty;
      done();
    })
    .catch((error) => {
      done(error);
    });
  });
});
