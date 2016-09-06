# PostCSS Inherit

[![Build Status](https://travis-ci.org/GarthDB/postcss-inherit.svg?branch=master)](https://travis-ci.org/GarthDB/postcss-inherit) [![Code Climate](https://codeclimate.com/github/GarthDB/postcss-inherit/badges/gpa.svg)](https://codeclimate.com/github/GarthDB/postcss-inherit) [![Issue Count](https://codeclimate.com/github/GarthDB/postcss-inherit/badges/issue_count.svg)](https://codeclimate.com/github/GarthDB/postcss-inherit) [![codecov](https://codecov.io/gh/GarthDB/postcss-inherit/branch/master/graph/badge.svg)](https://codecov.io/gh/GarthDB/postcss-inherit) [![Dependency Status](https://david-dm.org/GarthDB/postcss-inherit.svg)](https://david-dm.org/GarthDB/postcss-inherit) [![Inline docs](http://inch-ci.org/github/GarthDB/postcss-inherit.svg?branch=master)](http://inch-ci.org/github/GarthDB/postcss-inherit) [![npm version](https://badge.fury.io/js/postcss-inherit.svg)](https://badge.fury.io/js/postcss-inherit)

---

<a href="http://postcss.org/"><img align="right" width="95" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="http://postcss.github.io/postcss/logo.svg"></a>

Inherit plugin for [PostCSS](https://github.com/postcss/postcss). Allows you to inherit all the rules associated with a given selector. Modeled after [rework-inherit](https://github.com/reworkcss/rework-inherit).

## API

```js
var postcss = require('postcss');
var inherit = require('postcss-inherit')

postcss([ inherit ])
  .process(css, { from: 'src/app.css', to: 'app.css' })
  .then(function (result) {
    fs.writeFileSync('app.css', result.css);
    if ( result.map ) fs.writeFileSync('app.css.map', result.map);
  });
```

### Inherit(options{})

Option parameters:

* `propertyRegExp` - Regular expression to match the "inherit" at-rule.
  By default, it is `/^(inherit|extend)s?:?$/i`, so it matches "inherit", "inherits", "extend", and "extends".
  For example, if you only want to allow the `extend` keyword,
  set the regular expression to `/^extend$/`.

## Examples

### Regular inherit

```css
.gray {
  color: gray;
}

.text {
  @inherit: .gray;
}
```

yields:

```css
.gray,
.text {
  color: gray;
}
```

### Multiple inherit

Inherit multiple selectors at the same time.

```css
.gray {
  color: gray;
}

.black {
  color: black;
}

.button {
  @inherit: .gray, .black;
}
```

yields:

```css
.gray,
.button {
  color: gray;
}

.black,
.button {
  color: black;
}
```

### Placeholders

Any selector that includes a `%` is considered a placeholder.
Placeholders will not be output in the final CSS.

```css
%gray {
  color: gray;
}

.text {
  @inherit: %gray;
}
```

yields:

```css
.text {
  color: gray;
}
```

### Partial selectors

If you inherit a selector,
all rules that include that selector will be included as well.

```css
div button span {
  color: red;
}

div button {
  color: green;
}

button span {
  color: pink;
}

.button {
  @inherit: button;
}

.link {
  @inherit: div button;
}
```

yields:

```css
div button span,
div .button span,
.link span {
  color: red;
}

div button,
div .button,
.link {
  color: green;
}

button span,
.button span {
  color: pink;
}
```

### Chained inheritance

```css
.button {
  background-color: gray;
}

.button-large {
  @inherit: .button;
  padding: 10px;
}

.button-large-red {
  @inherit: .button-large;
  color: red;
}
```

yields:

```css
.button,
.button-large,
.button-large-red {
  background-color: gray;
}

.button-large,
.button-large-red {
  padding: 10px;
}

.button-large-red {
  color: red;
}
```

### Media Queries

Inheriting from inside a media query will create a copy of the declarations.
It will act like a "mixin".
Thus, with `%`placeholders, you won't have to use mixins at all.
Each type of media query will need its own declaration,
so there will be some inevitable repetition.

```css
.gray {
  color: gray
}

@media (min-width: 320px) {
  .button {
    @inherit: .gray;
  }
}

@media (min-width: 320px) {
  .link {
    @inherit: .gray;
  }
}
```

yields:

```css
.gray {
  color: gray;
}

@media (min-width: 320px) {
  .button,
  .link {
    color: gray;
  }
}
```

### Limitations

* When in a media query, you can only inherit rules from root, or rules contained in a media query with the same parameters.
