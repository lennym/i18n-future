/*eslint no-unused-vars:[2, { vars:"all", args: "none" }]*/

var _ = require('lodash');
var path = require('path');

var Translator = require('./translator');

module.exports = function (app, options) {

  options = options || {};
  options.cookie = options.cookie || {};

  var translator = new Translator(options);

  var detectLanguage = function (req, res) {
    let lang;
    var header = req.headers['accept-language'];
    if (options.cookie.name && req.cookies && req.cookies[options.cookie.name]) {
      lang = req.cookies[options.cookie.name].split(',');
    } else if (options.detect && header && header !== '*') {
      lang = _.map(header.split(','), (lng) => {
        return lng.split(';')[0];
      });
    }
    setLanguage(req, res, lang);
  };

  var setLanguage = function (req, res, lang) {
    req.lang = lang || [];
    if (typeof req.lang === 'string') req.lang = [req.lang];
    if (options.allowedLangs) {
      req.lang = _.intersection(req.lang, options.allowedLangs);
    }
    saveLanguage(req, res);
  }

  var saveLanguage = function (req, res) {
    if (req.lang && options.cookie.name && res.cookie) {
      res.cookie(options.cookie.name, req.lang.join(','), options.cookie);
    }
    res.locals = res.locals || {};
    res.locals.lang = req.lang;
    res.locals.htmlLang = _.first(req.lang) || _.first(translator.options.fallbackLang);
  };

  var mixinLocalisedView = function (Parent) {
    return class LocalisedView extends Parent {
      render(options, callback) {
        if (this.path) {
          let ext = path.extname(this.path);
          let dir = path.dirname(this.path);
          let base = path.basename(this.path, ext);
          let langs = translator.getLanguages({ lang: options.lang });
          let localisedPath = _.reduce(langs, (path, lang) => path || this.resolve(dir, base + '_' + lang + ext), null);
          if (localisedPath) this.path = localisedPath;
        }
        return super.render(options, callback);
      }
    };
  };

  var middleware = function (req, res, next) {
    detectLanguage(req, res);
    req.setLanguage = function(lang) {
      setLanguage(req, res, lang);
    };
    translator.on('ready', () => {
      req.translate = function translate(key, options) {
        options = options || {};
        options.lang = options.lang || req.lang;
        options.namespace = options.namespace || req.namespace;
        options = _.omitBy(options, _.isUndefined);
        return translator.translate(key, options);
      };
      next();
    });
  };

  var setup = function (app) {
    app.use(middleware);
    let View = app.get('view');
    let LocalisedView = mixinLocalisedView(View);
    app.set('view', LocalisedView);
  };

  if (app) setup(app);

  return {
    middleware,
    setup,
    detectLanguage,
    setLanguage,
    saveLanguage
  }
};
