# sass-templateify
Template function generator from SASS styles for browserify.

# Example
Styles:
```sass
.site__btn
	background: $palette.bg
```
Script:
```js
import BtnStyles from './btn.sasst'; // sasst/scsst/csst

var palette = {
	bg: "green"
};

BtnStyles({ palette }).then((style) => {
	console.log(style); // .site__btn { background: green }
});
```
