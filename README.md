# i18n-future
i18n for node

A ground up rebuild of the [i18next](http://www.npmjs.com/package/i18next) project for a node environment.

The [i18next](http://www.npmjs.com/package/i18next) project has a number of issues that result from it being a port of an originally client-side project. In particular that it maintains a single global datastore, and so if two modules resolve to the same instance then they will interfere with each other.

The aim of this project is to create a module-safe, lightweight translation library for a node environment, based on similar concepts to i18next.

## Usage

Standalone:

```javascript
var i18n = require('i18n-future');

// i18n fires a "ready" event when it is done loading resources
i18n.on('ready', function () {
    i18n.translate('name.first');
});
```

As express middleware:

```javascript
var app = require('express')();

var i18n = require('i18n-future').middleware();

app.use(i18n);

app.use(function (req, res, next) {
    // a translate method is now available on the request
    // this will translate keys according to the language request headers
    res.render('index', {
        title: req.translate('title')
    });
});

app.listen(3000);
```