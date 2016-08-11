import postcss from 'postcss';
import clone from './lib/clone';

const debug = require('debug')('postcss-inherit');

function isAtruleDescendant(node) {
  let { parent } = node;
  let descended = false;

  while (parent && parent.type !== 'root') {
    if (parent.type === 'atrule') {
      descended = true;
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
function replaceRegExp(val) {
  const expression = `${escapeRegExp(val)}($|\\s|\\>|\\+|~|\\:|\\[)`;
  let expressionPrefix = '(^|\\s|\\>|\\+|~)';
  if (isPlaceholder(val)) {
    // We just want to match an empty group here to preserve the arguments we
    // may be expecting in a RegExp match.
    expressionPrefix = '()';
  }
  return new RegExp(expressionPrefix + expression, 'g');
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

function getRule(x) {
  return x.rule;
}

function isEmptyArray(x) {
  if (!Array.isArray(x)) return true;
  if (!x.length) return true;
  if (x.length === 1 && x[0] === '') return true;
  return false;
}

export default class Inherit {
  constructor(css, opts = {}) {
    this.css = css;
    this.propertyRegExp = opts.propertyRegExp || /^(inherit|extend)s?$/i;
    this.matches = {};
    css.walkRules(rule => {
      if (!isAtruleDescendant(rule)) {
        rule.selectors = parseSelectors(rule.selector);
        this.inheritRules(rule);
        if (!rule.nodes.length) rule.remove();
      }
    });
    css.walkAtRules(atRule => {
      this.inheritMedia(atRule);
      if (!atRule.nodes.length) atRule.remove();
    });
    this.removePlaceholders();
  }
  inheritMedia(atRule) {
    const query = atRule.params;
    atRule.walkRules(rule => {
      const newRules = this.inheritMediaRules(rule, query);
      newRules.forEach((newRuleProperties) => {
        const newRule = postcss.rule(newRuleProperties);
        atRule.insertBefore(rule, newRule);
        const spacerArray = newRule.raws.before.split('\n');
        newRule.walkDecls(decl => {
          decl.raws.before = `\n${spacerArray.join('')}${spacerArray.join('')}`;
        });
      });
      if (!rule.nodes.length) rule.remove();
    });
  }
  inheritMediaRules(rule, query) {
    const selectors = rule.selectors = parseSelectors(rule.selector);
    let appendRules = [];
    rule.walkDecls(decl => {
      if (!this.propertyRegExp.test(decl.prop)) return;
      decl.value.split(',').map(x => x.trim()).forEach((val) => {
        appendRules = appendRules.concat(this.inheritMediaRule(val, selectors, query));
      });
      decl.remove();
    });
    return appendRules;
  }
  inheritMediaRule(val, selectors, query) {
    const matchedRules = this.matches[val] || this.matchRules(val);
    const alreadyMatched = matchedRules.media[query];
    const matchedQueryRules = alreadyMatched || this.matchQueryRule(val, query);
    if (!matchedQueryRules.rules.length) {
      throw new Error(`Failed to extend as media query from ${val}.`);
    }

    debug('extend %j in @media %j with %j', selectors, query, val);
    this.appendSelectors(matchedQueryRules, val, selectors);
    return alreadyMatched
      ? []
      : matchedQueryRules.rules.map(getRule);
  }
  matchQueryRule(val, query) {
    const matchedRules = this.matches[val] || this.matchRules(val);
    matchedRules.media[query] = {
      media: query,
      rules: matchedRules.rules.map(rule => {
        const newRule = {
          raws: {},
          type: 'rule',
          nodes: [],
          selector: '',
          selectors: [],
        };
        rule.rule.walkDecls(decl => {
          newRule.nodes.push(clone(decl, newRule));
        });
        return {
          selectors: rule.selectors,
          declarations: rule.declarations,
          rule: newRule,
        };
      }),
    };
    return matchedRules.media[query];
  }
  inheritRules(rule) {
    const selectors = rule.selectors;
    rule.walkDecls(decl => {
      if (!this.propertyRegExp.test(decl.prop)) return;
      decl.value.split(',').map(x => x.trim()).forEach((val) => {
        this.inheritRule(val, selectors);
      });
      decl.remove();
    });
  }
  inheritRule(val, selectors) {
    const matchedRules = this.matches[val] || this.matchRules(val);

    if (!matchedRules.rules.length) {
      throw new Error(`Failed to extend from ${val}.`);
    }

    debug('extend %j with %j', selectors, val);
    this.appendSelectors(matchedRules, val, selectors);
  }
  matchRules(val) {
    const matchedRules = this.matches[val] = {
      rules: [],
      media: {},
    };
    this.css.walkRules(rule => {
      if (!rule.selectors) return;
      const matchedSelectors = rule.selectors.filter(selector =>
        selector.match(replaceRegExp(val))
      );
      if (!matchedSelectors.length) return;
      matchedRules.rules.push({
        selectors: matchedSelectors,
        declarations: rule.nodes,
        rule,
      });
    });
    return matchedRules;
  }
  appendSelectors(matchedRules, val, selectors) {
    matchedRules.rules.forEach((matchedRule) => {
      if (!{}.hasOwnProperty.call(matchedRule, 'selectors')) matchedRule.selectors = [];
      matchedRule.selectors.forEach(matchedSelector => {
        matchedRule.rule.selectors = matchedRule.rule.selectors.concat(selectors.map((selector) =>
          replaceSelector(matchedSelector, val, selector)
        ));
      });
      matchedRule.rule.selector = assembleSelectors(matchedRule.rule.selectors);
    });
  }
  removePlaceholders() {
    const css = this.css;
    css.walkRules(rule => {
      const selectors = rule.selectors;
      if (!selectors) return;
      rule.selectors = rule.selectors.filter(selector =>
        (!~selector.indexOf('%'))
      );
      rule.selector = assembleSelectors(rule.selectors);
      if (isEmptyArray(rule.selectors)) {
        rule.remove();
      }
      delete rule.selectors;
    });
  }
}
