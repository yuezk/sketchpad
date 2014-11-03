Sketchpad
=========

A small sketchpad for mobie browsers

![Screenshot](http://s3.imgs.cc/img/ETzl5Yq.png)

Usage
=====

html:

```html
...
<script src="path/to/sketchpad.js"></script>
<canvas id="canvas"></canvas>
...
```

JS:

```javascript
var options = {
    penColor: '#f20',
    penWidth: 3
};

var pad = new Sketchpad('canvas', options);
```

Public API
==========

getDataURI()
-----------

返回`base64`编码过的图片

clear()
-------

清空画板

Support
=======

Tested on:

- Safari(iOS 8.1)
- Android 4.2.2
- IE Mobile 11(WP8.1) multi-touch not supported

Should work on the modern mobile broswer.