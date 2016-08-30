/**
 * Public: clones a PostCSS node.
 *
 * * `obj` {Object} PostCSS node to be cloned.
 * * `parent` {Object} PostCSS node of new parent node where node will be moved to.
 *
 * ## Example
 *
 *    const newRule = clone(targetRule);
 *    newRule.moveBefore(originRule);
 *
 * Returns {Object} PostCSS node instance of the new cloned node.
 */
const clone = (obj, parent) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  const cloned = new obj.constructor();
  Object.keys(obj).forEach(i => {
    // if (!({}.hasOwnProperty.call(obj, i))) {
    //   return;
    // }
    const value = obj[i];
    if (i === 'parent' && typeof value === 'object') {
      if (parent) {
        cloned[i] = parent;
      }
    } else if (i === 'source') {
      cloned[i] = value;
    } else if (value instanceof Array) {
      cloned[i] = value.map(j => clone(j, cloned));
    } else {
      cloned[i] = clone(value, cloned);
    }
  });
  return cloned;
};

export default clone;
