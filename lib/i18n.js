var Translator = require('./translator');

function i18n(options) {
  return new Translator(options);
}

i18n.middleware = require('./middleware');

i18n.Translator = Translator;

i18n.backends = {
  fs: require('./backends/fs')
};

module.exports = i18n;
