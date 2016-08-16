/* eslint-disable no-unused-vars */
import postcss from 'postcss';
import clone from './lib/clone';

const debug = require('debug')('postcss-inherit');

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
function isPlaceholder(val) {
  return val[0] === '%';
}
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function matchRegExp(val) {
  const expression = `${escapeRegExp(val)}((?:$|\\s|\\>|\\+|~|\\:|\\[)?)`;
  let expressionPrefix = '(^|\\s|\\>|\\+|~)';
  if (isPlaceholder(val)) {
    // We just want to match an empty group here to preserve the arguments we
    // may be expecting in a RegExp match.
    expressionPrefix = '()';
  }
  return new RegExp(expressionPrefix + expression, 'g');
}
function replaceRegExp(val) {
  const operatorRegex = /($|::?|\[)/g;
  const newVal = (val.match(operatorRegex)) ? val.substring(0, val.search(operatorRegex)) : val;
  return matchRegExp(newVal);
}
function replaceSelector(matchedSelector, val, selector) {
  return matchedSelector.replace(replaceRegExp(val), (_, first, last) =>
    first + selector + last
  );
}
function parseSelectors(selector) {
  return selector.split(',').map(x => x.trim());
}
function assembleSelectors(selectors) {
  return selectors.join(',\n');
}
function sameQuery(nodeOne, nodeTwo) {
  const atParamsOne = isAtruleDescendant(nodeOne);
  const atParamsTwo = isAtruleDescendant(nodeTwo);
  return (atParamsOne && atParamsOne === atParamsTwo);
}

export default class Inherit {
  constructor(css, opts = {}) {
    this.root = css;
    this.propertyRegExp = opts.propertyRegExp || /^(inherit|extend)s?$/i;
    this.root.walkDecls(decl => {
      if (this.propertyRegExp.test(decl.prop)) {
        const rule = decl.parent;
        parseSelectors(decl.value).forEach(value => {
          this.inheritRule(value, rule);
        });
        decl.remove();
        if (!rule.nodes.length) rule.remove();
      }
    });
    this.removePlaceholders();
  }
  inheritRule(value, originRule) {
    const originSelector = originRule.selector;
    const originAtParams = isAtruleDescendant(originRule);
    const targetSelector = value;

    this.root.walkRules(rule => {
      if (!matchRegExp(targetSelector).test(rule.selector)) return;
      const targetRule = rule;
      const targetAtParams = isAtruleDescendant(targetRule);
      if (targetAtParams === originAtParams) {
        this.appendSelector(originSelector, targetRule, targetSelector);
      } else if (!targetAtParams) {
        this.copyDeclarations(originRule, targetRule);
      }
    });
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
  copyDeclarations(originRule, targetRule) {
    targetRule.nodes.forEach(node => {
      const newNode = clone(node);
      newNode.moveTo(originRule);
    });
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
