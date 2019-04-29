/*eslint no-unused-vars:[2, { vars:"all", args: "none" }]*/

const _ = require('lodash');
const Translator = require('./translator');
const localisedView = require('./localised-view'); 

module.exports = (app, options) => {

  options = options || {};
  options.cookie = options.cookie || {};

  const translator = new Translator(options);

  const detectLanguage = (req, res) => {
    let lang;
    const header = req.headers['accept-language'];
    if (options.cookie.name && req.cookies && req.cookies[options.cookie.name]) {
      lang = req.cookies[options.cookie.name].split(',');
    } else if (options.detect && header && header !== '*') {
      lang = _.map(header.split(','), (lng) => {
        return lng.split(';')[0];
      });
    }
    setLanguage(req, res, lang);
  };

  const setLanguage = (req, res, lang) => {
    req.lang = lang || [];
    if (typeof req.lang === 'string') req.lang = [req.lang];
    if (options.allowedLangs) {
      req.lang = _.intersection(req.lang, options.allowedLangs);
    }
    saveLanguage(req, res);
  }

  const saveLanguage = (req, res) => {
    if (req.lang && options.cookie.name && res.cookie) {
      res.cookie(options.cookie.name, req.lang.join(','), options.cookie);
    }
    res.locals = res.locals || {};
    res.locals.lang = req.lang;
    res.locals.htmlLang = _.first(req.lang) || _.first(translator.options.fallbackLang);
  };

  const middleware = function (req, res, next) {
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
      res.locals.translate = req.translate;
      next();
    });
  };

  const setup = () => {
    app.use(middleware);
    const View = app.get('view');
    let views = app.get('views');
    if (!Array.isArray(views)) views = [ views ];
    const LocalisedView = localisedView.mixin(View, views, translator);
    app.set('view', LocalisedView);
  };

  if (app) setup();

  return {
    middleware,
    setup,
    detectLanguage,
    setLanguage,
    saveLanguage
  }
};
