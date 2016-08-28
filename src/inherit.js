import clone from './clone';

const debug = require('debug')('postcss-inherit');

/**
 * Private: checks if a node is a decendant of an [AtRule](http://api.postcss.org/AtRule.html).
 *
 * * `node` {Object} PostCSS Node to check.
 *
 * ## Example
 *
 *    const atRule = postcss.parse('@media (min-width: 480px) {a{}}').first;
 *    const rule = atRule.first;
 *    isAtruleDescendant(rule); // returns '(min-width: 480px)'
 *
 * Returns {Boolean} of false, or {String} of AtRule params if true.
 */
function isAtruleDescendant(node) {
  let { parent } = node;
  let descended = false;

  while (parent && parent.type !== 'root') {
    if (parent.type === 'atrule') {
      descended = parent.params;
    }
    parent = parent.parent;
  }
  return descended;
}
/**
 * Private: checks string to see if it has the placeholder syntax (starts with %)
 *
 * * `val` a {String} intended for inherit value or rule name.
 *
 * ## Example
 *
 *    const ruleName = '%placeholder';
 *    isPlaceholder(ruleName); // returns true
 *
 * Returns {Boolean}
 */
function isPlaceholder(val) {
  return val[0] === '%';
}
/**
 * Private: gets a string ready to use in a regular expression.
 *
 * * `str` {String} to escape RegExp reserved characters.
 *
 * ## Example
 *
 *    escapeRegExp('div[class^="top"]::before'); // returns div\[class\^="top"\]::before
 *
 * Returns {String} for use in a regualr expression.
 */
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}
/**
 * Private: creates a regular expression used to find rules that match inherit property.
 *
 * * `val` {String} inherit property to use to find selectors that contain it.
 *
 * ## Example
 *
 *    matchRegExp('div[class^="top"]::before');
 *    // returns /(^|\s|\>|\+|~)div\[class\^="top"\]::before($|\s|\>|\+|~|\:|\[)/g
 *
 * Returns {RegExp} used for finding rules that match inherit property.
 */
function matchRegExp(val) {
  const expression = `${escapeRegExp(val)}($|\\s|\\>|\\+|~|\\:|\\[)`;
  let expressionPrefix = '(^|\\s|\\>|\\+|~)';
  if (isPlaceholder(val)) {
    // We just want to match an empty group here to preserve the arguments we
    // may be expecting in a RegExp match.
    expressionPrefix = '()';
  }
  return new RegExp(expressionPrefix + expression, 'g');
}
/**
 * Private: creates a regular expression used to replace selector with inherit property inserted
 *
 * * `val` {String} inherit property to use to replace selectors that contain it.
 *
 * ## Example
 *
 *    replaceRegExp
 *
 * Returns {RegExp} used to replace selector with inherit property inserted
 */
function replaceRegExp(val) {
  const operatorRegex = /($|::?|\[)/g;
  const newVal = (val.match(operatorRegex)) ? val.substring(0, val.search(operatorRegex)) : val;
  return matchRegExp(newVal);
}
/**
 * Private: replaces selector with inherit property inserted.
 *
 * * `matchedSelector` {String} selector of the rule that matches the inherit value
 * * `val` {String} value of the inherit property
 * * `selector` {String} selector of the rule that contains the inherit declaration.
 *
 * ## Example
 *
 *    replaceSelector('.button-group %dark-button', '%dark-button', '.some-button');
 *    // returns '.button-group .some-button'
 *
 * Returns {String} new selector.
 */
function replaceSelector(matchedSelector, val, selector) {
  console.log(`matchedSelector ${matchedSelector}`);
  console.log(`val ${val}`);
  console.log(`selector ${selector}`);
  return matchedSelector.replace(replaceRegExp(val), (_, first, last) =>
    first + selector + last
  );
}
function makePlaceholder(selector, value) {
  return selector.replace(replaceRegExp(value), (_, first, last) =>
    `%${_}${first}${last}`
  );
}
function parseSelectors(selector) {
  return selector.split(',').map(x => x.trim());
}
function assembleSelectors(selectors) {
  return selectors.join(',\n');
}
function mediaMatch(object, key, value) {
  if (!{}.hasOwnProperty.call(object, key)) {
    return false;
  }
  return ~object[key].indexOf(value);
}
function removeParentsIfEmpty(node) {
  let currentNode = node.parent;
  node.remove();
  while (!currentNode.nodes.length) {
    const parent = currentNode.parent;
    currentNode.remove();
    currentNode = parent;
  }
}
function findInArray(array, regex) {
  let result = -1;
  array.forEach((value, index) => {
    if (regex.test(value)) result = index;
  });
  return result;
}
export default class Inherit {
  constructor(css, opts = {}) {
    this.root = css;
    this.matches = {};
    this.propertyRegExp = opts.propertyRegExp || /^(inherit|extend)s?$/i;
    this.root.walkAtRules(atRule => {
      this.atRuleInheritsFromRoot(atRule);
    });
    this.root.walkDecls(decl => {
      if (this.propertyRegExp.test(decl.prop)) {
        const rule = decl.parent;
        parseSelectors(decl.value).forEach(value => {
          this.inheritRule(value, rule, decl);
        });
        removeParentsIfEmpty(decl);
      }
    });
    this.removePlaceholders();
  }
  atRuleInheritsFromRoot(atRule) {
    atRule.walkDecls(decl => {
      if (this.propertyRegExp.test(decl.prop)) {
        const originRule = decl.parent;
        const originAtParams = isAtruleDescendant(originRule);
        const newValueArray = [];
        parseSelectors(decl.value).forEach(value => {
          const targetSelector = value;
          let newValue = value;
          this.root.walkRules(rule => {
            if (!matchRegExp(targetSelector).test(rule.selector)) return;
            const targetAtParams = isAtruleDescendant(rule);
            if (!targetAtParams) {
              newValue = `%${value}`;
            } else {
              return;
            }
            if (!mediaMatch(this.matches, originAtParams, targetSelector)) {
              const newRule = this.copyRule(originRule, rule);
              newRule.selector = makePlaceholder(newRule.selector, targetSelector);
              this.matches[originAtParams] = this.matches[originAtParams] || [];
              this.matches[originAtParams].push(targetSelector);
              this.matches[originAtParams] = [...new Set(this.matches[originAtParams])];
            }
          });
          newValueArray.push(newValue);
        });
        decl.value = newValueArray.join(', ');
      }
    });
  }
  inheritRule(value, originRule, decl) {
    const originSelector = originRule.selector;
    const originAtParams = originRule.atParams || isAtruleDescendant(originRule);
    const targetSelector = value;
    let matched = false;
    let differentLevelMatched = false;
    this.root.walkRules(rule => {
      if (!~findInArray(parseSelectors(rule.selector), matchRegExp(targetSelector))) return;
      const targetRule = rule;
      const targetAtParams = targetRule.atParams || isAtruleDescendant(targetRule);
      if (targetAtParams === originAtParams) {
        debug('extend %j with %j', originSelector, targetSelector);
        this.appendSelector(originSelector, targetRule, targetSelector);
        matched = true;
      } else {
        differentLevelMatched = true;
      }
    });
    if (!matched) {
      if (differentLevelMatched) {
        throw decl.error(`Could not find rule that matched ${value} in the same atRule.`);
      } else {
        throw decl.error(`Could not find rule that matched ${value}.`);
      }
    }
  }
  appendSelector(originSelector, targetRule, value) {
    const originSelectors = parseSelectors(originSelector);
    let targetRuleSelectors = parseSelectors(targetRule.selector);
    targetRuleSelectors.forEach(targetRuleSelector => {
      [].push.apply(targetRuleSelectors, originSelectors.map(newOriginSelector =>
        replaceSelector(targetRuleSelector, value, newOriginSelector)
      ));
    });
    // removes duplicate selectors
    targetRuleSelectors = [...new Set(targetRuleSelectors)];
    targetRule.selector = assembleSelectors(targetRuleSelectors);
  }
  copyRule(originRule, targetRule) {
    const newRule = clone(targetRule);
    newRule.moveBefore(originRule);
    return newRule;
  }
  removePlaceholders() {
    this.root.walkRules(/%/, rule => {
      const selectors = parseSelectors(rule.selector);
      const newSelectors = selectors.filter(selector =>
        (!~selector.indexOf('%'))
      );
      if (!newSelectors.length) {
        rule.remove();
      } else {
        rule.selector = assembleSelectors(newSelectors);
      }
    });
  }
}
