var i18n = require('../../index');

describe('i18n.middleware', function () {

  it('exports a function', function () {
    i18n.middleware.should.be.a('function');
  });

  it('returns a middleware stack', function () {
    i18n.middleware().should.be.a('function');
  });

  describe('req.translate', function () {

    var req, res, next, middleware;
    beforeEach(function () {
      req = require('reqres').req();
      res = require('reqres').res();
      next = sinon.stub();
      sinon.stub(i18n.Translator.prototype, 'translate');
      sinon.stub(i18n.backends.fs, 'load').yieldsAsync(null, {});
      middleware = i18n.middleware({ cookie: { name: 'lang', maxAge: 86400 } });
    });
    afterEach(function () {
      i18n.Translator.prototype.translate.restore();
      i18n.backends.fs.load.restore();
    });

    it('is a function', function (done) {
      middleware(req, res, function () {
        req.translate.should.be.a('function');
        done();
      });
    });

    it('calls through to Translator instance', function (done) {
      middleware(req, res, function () {
        req.translate('key');
        i18n.Translator.prototype.translate.should.have.been.calledWith('key');
        done();
      });
    });

    it('sets language for translation from accept header', function (done) {
      req.headers['accept-language'] = 'en';
      middleware(req, res, function () {
        req.translate('key');
        i18n.Translator.prototype.translate.should.have.been.calledWith('key', { lang: ['en'] });
        done();
      });
    });

    it('handles complex language headers', function (done) {
      req.headers['accept-language'] = 'en-GB;q=0.8,en-US;q=0.7';
      middleware(req, res, function () {
        req.translate('key');
        i18n.Translator.prototype.translate.should.have.been.calledWith('key', { lang: ['en-GB', 'en-US'] });
        done();
      });
    });

    it('if no language header is present detect language from cookie', function (done) {
      req.cookies.lang = 'en';
      middleware(req, res, function () {
        req.translate('key');
        i18n.Translator.prototype.translate.should.have.been.calledWith('key', { lang: ['en'] });
        done();
      });
    });

    it('splits multiple language in cookies', function (done) {
      req.cookies.lang = 'en-GB,en';
      middleware(req, res, function () {
        req.translate('key');
        i18n.Translator.prototype.translate.should.have.been.calledWith('key', { lang: ['en-GB', 'en'] });
        done();
      });
    });

    it('saves language value back to a cookie', function (done) {
      req.headers['accept-language'] = 'en-GB;q=0.8,en-US;q=0.7';
      middleware(req, res, function () {
        res.cookie.should.have.been.calledWith('lang', 'en-GB,en-US');
        done();
      });
    });

    it('passes cookie options to res.cookie', function (done) {
      req.headers['accept-language'] = 'en-GB;q=0.8,en-US;q=0.7';
      middleware(req, res, function () {
        res.cookie.should.have.been.calledWith('lang', 'en-GB,en-US', sinon.match({ maxAge: 86400 }));
        done();
      });
    });

    it('uses pre-existing req.lang property if it exists', function (done) {
      req.headers['accept-language'] = 'en-GB;q=0.8,en-US;q=0.7';
      req.lang = 'fr';
      middleware(req, res, function () {
        req.translate('key');
        i18n.Translator.prototype.translate.should.have.been.calledWith('key', { lang: ['fr'] });
        done();
      });
    });

  });

});