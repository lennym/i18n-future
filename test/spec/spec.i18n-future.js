var i18n = require('../../');

describe('i18n-future', function () {

  it('exports a function', function () {
    i18n.should.be.a('function');
  });

  it('returns a translator instance', function () {
    i18n().should.be.an.instanceOf(i18n.Translator);
  });

});