# i18n-future
i18n for node

A ground up rebuild of the [i18next](http://www.npmjs.com/package/i18next) project for a node environment.

The [i18next](http://www.npmjs.com/package/i18next) project has a number of issues that result from it being a port of an originally client-side project. In particular that it maintains a single global datastore, and so if two modules resolve to the same instance then they will interfere with each other.

The aim of this project is to create a module-safe, lightweight translation library for a node environment, based on similar concepts to i18next.

## Install

```
npm install [--save] i18n-future
```

## Usage

First create some resource files. These should be json files and the location of the file within your project will define the language it corresponds to.

An example file structure would look like:

```
index.js
/locales
  /en
    /default.json
  /fr
    /default.json
  /de
    /default.json
```

If you wish to create additional namespaces within your project, then create additional files within a language directory with names corresponding to the namespace. For details on how to configure resource paths see ["Resource path" documentation below](#resource-path)

### Standalone:

```javascript
var i18n = require('i18n-future');

// i18n fires a "ready" event when it is done loading resources
i18n.on('ready', function () {
    i18n.translate('name.first');
});
```

### As express middleware:

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

### As express middleware with custom language detection:

Middleware will detect the language from the `Accepts` header by default, but if custom language detection is required then additional middleware can be added which sets `req.lang`.

```javascript
var app = require('express')();

var i18n = require('i18n-future').middleware();

app.use(function (req, res, next) {
    // load language from querystring parameter - e.g. ?lang=en
    req.lang = req.query.lang;
    next();
});
app.use(i18n);
...
```

### Passing language and namespace options

The translate method takes an additional options object with parameters for language and namespace to be loaded. This applies to both standalone and express middleware options (although in the middleware case any language option will overwrite the accepts header as a language preference)

```javascript
// simple language option
i18n.translate('greeting', { lang: 'fr' });
// multiple langauge options as an array
i18n.translate('greeting', { lang: ['en-GB', 'en'] });
```

```javascript
// simple namespace option
i18n.translate('greeting', { namespace: 'admin' });
```

For running code examples, look in [the examples directory](./examples).

## Initialisation options

In each case options can be passed both to the i18n function, or to the middleware constructor equivalently.

### Pre-defined resources

You can manually define resource sets at initialisation by passing in an object with the `resources` parameter of the options. This is useful when you have shared translations that are used across a number of modules, so you may wish to load from npm modules or similar - Default: `{}`

```javascript
i18n({
    resources: {
      en: require('shared-translations').en,
      fr: require('shared-translations').fr
    }
});
```

This object should have the same structure as the resources returned by [backends](#backend)

### Fallback language:

Set the language which is used as the fallback when none is specified, or the requested key does not exist in the requested language - Default: `'en'`

```javascript
i18n({
    fallbackLng: 'en-GB'
});
```

### Fallback namespace:

Set the namespace which is used as the fallback when none is specified, or the requested key does not exist in the requested namespace - Default: `'default'`

```javascript
i18n({
    fallbackNamespace: 'admin'
});
```

If required, both the `fallbackLng` and `fallbackNamespace` options can be passed as an array.

### Resource path

For the fs resource loader (currently the only backend supported), sets the location to load resource files from, and pattern for parsing namespace and language from the file path - Default: `locales/__lng__/__ns__.json`.

```javascript
i18n({
    path: '/var/i18n/__lng__/__ns__/resource.json'
});
```

### Backend

Allows setting a custom backend for non-fs resource loading. Backend must export a `load` method, which will be called with `options` object and a callback. Default: [fs resource loader](./lib/backends/fs.js)

```javascript
i18n({
    backend: {
        load: function (options, callback) {
            // do custom resource loading
            callback(null, resources);
        }
    }
});
```

Resources returned by the callback will be an object of the following form:

```javascript
{
    en: {
        default: {
            ... translation keys for default namespace ...
        }
        'other-namespace': {
            ... translation keys for afternative namespace...
        }
    },
    fr: {
        ...
    },
    de: {
        ...
    }
}
```
