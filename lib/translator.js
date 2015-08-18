var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var _ = require('lodash');

function arrayify(value) {
  if (value) {
    return _.isArray(value) ? value : [value];
  } else {
    return [];
  }
}

function Translator(options) {
  options = _.extend({
    resources: {},
    backend: require('./backends/fs'),
    fallbackLang: ['en'],
    fallbackNamespace: ['default']
  }, options);


  this.options = options;

  if (typeof this.options.backend.load !== 'function') {
    throw new Error('Invalid backend. Backend must expose a `load` method.');
  }

  this._ready = false;
  this.on('ready', function () {
    this._ready = true;
  }.bind(this));

  this.reload();
}

util.inherits(Translator, EventEmitter);

Translator.prototype.on = function (event, handler) {
  if (event === 'ready' && this._ready) {
    process.nextTick(handler);
  } else {
    return EventEmitter.prototype.on.apply(this, arguments);
  }
};

Translator.prototype.reload = function () {
  this.datastore = _.cloneDeep(this.options.resources);
  this.options.backend.load(this.options, function (err, data) {
    if (err) {
      throw err;
    } else {
      _.merge(this.datastore, data);
      this.emit('ready');
    }
  }.bind(this));
};

Translator.prototype.translate = function (keys, options) {
  options = options || {};

  var langs = this.getLanguages(options),
      namespaces = this.getNamespaces(options);

  keys = arrayify(keys);

  return _.reduce(langs, function (str, lang) {
    return str || _.reduce(namespaces, function (str, ns) {
      return str || _.reduce(keys, function (str, k) {
        this.datastore[lang] = this.datastore[lang] || {};
        return str || _.get(this.datastore[lang][ns], k);
      }, null, this);
    }, null, this);
  }, null, this) || options.default || keys[0];
};

Translator.prototype.getLanguages = function (options) {
  options = options || {};
  var langs = _.clone(this.options.fallbackLang) || [];
  options.lang = arrayify(options.lang);
  _.each(options.lang, function (lng) {
    if (lng.indexOf('-')) {
      langs.unshift(lng.split('-')[0]);
    }
    langs.unshift(lng);
  });
  return _.uniq(langs);
};

Translator.prototype.getNamespaces = function (options) {
  options = options || {};
  var namespaces = this.options.fallbackNamespace || [];
  options.namespace = arrayify(options.namespace);
  return _.uniq([].concat(options.namespace, namespaces));
};

module.exports = Translator;
