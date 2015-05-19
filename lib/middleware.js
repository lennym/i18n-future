/*eslint no-unused-vars:[2, { vars:"all", args: "none" }]*/

var _ = require('lodash');

var Translator = require('./translator');

module.exports = function (options) {

  options = options || {};
  options.cookie = options.cookie || {};

  var translator = new Translator(options);

  var detectLanguage = function (req, res) {
    var header = req.headers['accept-language'];
    if (header && header !== '*') {
      req.lang = req.lang || _.map(header.split(','), function (lng) {
        return lng.split(';')[0];
      });
    } else if (options.cookie.name && req.cookies && req.cookies[options.cookie.name]) {
      req.lang = req.lang || req.cookies[options.cookie.name].split(',');
    }
    if (typeof req.lang === 'string') {
      req.lang = [req.lang];
    }
  };

  var saveLanguage = function (req, res) {
    if (req.lang && options.cookie.name && res.cookie) {
      res.cookie(options.cookie.name, req.lang.join(','), options.cookie);
    }
  };

  var middleware = function (req, res, next) {
    detectLanguage(req, res);
    saveLanguage(req, res);
    translator.on('ready', function () {
      req.translate = function translate(key, options) {
        options = options || {};
        options.lang = options.lang || req.lang;
        return translator.translate(key, options);
      };
      next();
    });
  };

  return middleware;
};
