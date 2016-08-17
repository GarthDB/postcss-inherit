import postcss from 'postcss';
import test from 'ava';
import fs from 'fs';
import perfectionist from 'perfectionist';
import inheritParser from 'postcss-inherit-parser';
import importAt from 'postcss-import';
import inherit from '../src/index';

function runInherit(input, opts) {
  return postcss([
    inherit(opts),
    perfectionist({ indentSize: 2, maxAtRuleLength: false, maxSelectorLength: 1 }),
  ]).process(input, { parser: inheritParser });
}

function read(file) {
  return fs.readFileSync(`./fixtures/${file}.css`, 'utf8').trim();
}

test('should handle a placeholder', t => {
  const output = read('placeholder.out');
  return runInherit(read('placeholder')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should extend a basic class', t => {
  const output = read('class.out');
  return runInherit(read('class')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should handle attribute selectors', t => {
  const output = read('attribute.out');
  return runInherit(read('attribute')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should clearfix', t => {
  const output = read('clearfix.out');
  return runInherit(read('clearfix')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should clearfix zoom', t => {
  const output = read('clearfix.zoom.out');
  return runInherit(read('clearfix.zoom')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should combine inherits', t => {
  const output = read('combined.out');
  return runInherit(read('combined')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should inherit through media', t => {
  const output = read('media.out');
  return runInherit(read('media')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should inherit disjoint media', t => {
  const output = read('media.disjoint.out');
  return runInherit(read('media.disjoint')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should inherit substring', t => {
  const output = read('substring.out');
  return runInherit(read('substring')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should inherit multiple selectors', t => {
  const output = read('multiple.out');
  return runInherit(read('multiple')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should inherit a tag', t => {
  const output = read('tag.out');
  return runInherit(read('tag')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should chain inheritance', t => {
  const output = read('chain.out');
  return runInherit(read('chain')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should inherit out of order', t => {
  const output = read('unordered.out');
  return runInherit(read('unordered')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should sequence inheritance (e.g. .one.two%three)', t => {
  const output = read('sequence.out');
  return runInherit(read('sequence')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should sequence complex inheritance (e.g. .one.two%three)', t => {
  const output = read('complex-sequence.out');
  return runInherit(read('complex-sequence')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should extend regexp', t => {
  const output = read('chain.out');
  return runInherit(read('extend'), { propertyRegExp: /^extends?$/ }).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});
test('should extend regexp', t => {
  const output = read('pseudo.out');
  return runInherit(read('pseudo')).then(result => {
    t.deepEqual(result.css.trim(), output);
  });
});

test('should throw an error when missing a selector', t => {
  t.throws(runInherit(read('missing-selector')), /Could not find rule that matched %form\./);
});

test('should throw an error when atrules don\'t match', t => {
  t.throws(
    runInherit(read('mismatch-atrules')),
    /Could not find rule that matched \.gray in the same atRule\./
  );
});

test('should work after another plugin', t => {
  const inputcss = read('import');
  const output = read('import.out');
  postcss([importAt(), inherit()]).process(inputcss)
  .then((result) => {
    t.deepEqual(result.css.trim(), output);
  })
  .catch(console.log);
});

test('should create a component', t => {
  const inputcss = read('button');
  const output = read('button.out');
  postcss([importAt(), inherit()])
    .process(inputcss, { from: './test/fixtures/button.css' })
    .then((result) => {
      t.deepEqual(result.css.trim(), output);
    })
    .catch(console.log);
});
