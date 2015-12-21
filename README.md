# style-templateify
Template function generator from CSS/SASS styles for browserify.

# Example
Styles:
```sass
.site__btn
	background: $palette.bg
```
Script:
```js
import BtnStyles from './btn.sass';

var palette = {
	bg: "green"
};

console.log(BtnStyles({ palette })); // .site__btn { background: green }
```
