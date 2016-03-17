[![NPM](https://nodei.co/npm/style-templateify.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/style-templateify/)

# style-templateify
Template function generator from CSS/SASS styles for browserify.

# Example
Styles:
```sass
.site__btn
	background: {{palette.bg}}
```
Script:
```js
import BtnStyles from './btn.sasst'; // sasst/scsst/csst

var palette = {
	bg: "green"
};

console.log(BtnStyles({ palette })); // .site__btn { background: green }
```

Also you can use `style-templateify` with Node.js:
```js
import { install } from 'style-templateify';

install();

...

import BtnStyles from './btn.sasst'; 

```