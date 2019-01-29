var i18n = require('../../index');

describe('i18n.middleware', function () {
  var req, res, next, app, options;
  beforeEach(function () {
    app = {
      use: sinon.stub(),
      get: sinon.stub().withArgs('view').returns(class {}),
      set: sinon.stub()
    };
    req = require('reqres').req();
    res = require('reqres').res();
    next = sinon.stub();
    sinon.stub(i18n.Translator.prototype, 'translate');
    sinon.stub(i18n.backends.fs, 'load').yieldsAsync(null, {});
    options = { cookie: { name: 'lang', maxAge: 86400 } };
  });
  afterEach(function () {
    i18n.Translator.prototype.translate.restore();
    i18n.backends.fs.load.restore();
  });

  it('returns a function', function () {
    i18n.middleware.should.be.a('function');
  });

  describe('req.translate', function () {
    var middleware;

    beforeEach(function () {
      i18n.middleware(app, options);
      middleware = app.use.args[0][0];
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
      options.detect = true;
      req.headers['accept-language'] = 'en';
      middleware(req, res, function () {
        req.translate('key');
        i18n.Translator.prototype.translate.should.have.been.calledWith('key', { lang: ['en'] });
        done();
      });
    });

    it('handles complex language headers', function (done) {
      options.detect = true;
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
      options.detect = true;
      req.headers['accept-language'] = 'en-GB;q=0.8,en-US;q=0.7';
      middleware(req, res, function () {
        res.cookie.should.have.been.calledWith('lang', 'en-GB,en-US');
        done();
      });
    });

    it('passes cookie options to res.cookie', function (done) {
      options.detect = true;
      req.headers['accept-language'] = 'en-GB;q=0.8,en-US;q=0.7';
      middleware(req, res, function () {
        res.cookie.should.have.been.calledWith('lang', 'en-GB,en-US', { maxAge: 86400, name: 'lang' });
        done();
      });
    });

    it('uses pre-existing lang cookie property if it exists', function (done) {
      options.detect = true;
      req.headers['accept-language'] = 'en-GB;q=0.8,en-US;q=0.7';
      req.cookies.lang = 'fr';
      middleware(req, res, function () {
        req.translate('key');
        i18n.Translator.prototype.translate.should.have.been.calledWith('key', { lang: ['fr'] });
        done();
      });
    });

    it('reduce lang list to allowed langs if specified', function (done) {
      options.allowedLangs = ['de', 'en'];
      req.cookies.lang = 'fr,es,de,it';
      middleware(req, res, function () {
        req.translate('key');
        i18n.Translator.prototype.translate.should.have.been.calledWith('key', { lang: ['de'] });
        done();
      });
    });

  });

  describe('localisedViews middleware', () => {
    let OriginalViewClass, NewClass, options, cb;

    beforeEach(() => {
        OriginalViewClass = class {
            render() {}
            resolve() {}
        };
        sinon.stub(OriginalViewClass.prototype, 'render');
        sinon.stub(OriginalViewClass.prototype, 'resolve');

        app.get = sinon.stub().withArgs('view').returns(OriginalViewClass);

        i18n.middleware(app, options);
        NewClass = app.set.args[0][1];
        cb = sinon.stub();
        options = {};
    });

    it('sets the view class to an exended view class', () => {
        app.set.should.have.been.calledWithExactly('view', sinon.match.func);

        let instance = new NewClass;
        instance.should.be.an.instanceOf(OriginalViewClass);
    });

    it('tries localised path', () => {
        let instance = new NewClass;
        instance.path = '/path/file.html';
        options.lang = ['fr'];

        instance.render(options, cb);

        OriginalViewClass.prototype.resolve.should.have.been.calledWithExactly('/path', 'file_fr.html');
    });

    it('tupdates render path if resolve succeeds', () => {
        let instance = new NewClass;
        instance.path = '/path/file.html';
        options.lang = ['fr'];
        OriginalViewClass.prototype.resolve.withArgs('/path', 'file_fr.html').returns('/resolved/path/file_fr.html');

        instance.render(options, cb);

        instance.path.should.equal('/resolved/path/file_fr.html');
    });

    it('calls super render', () => {
        let instance = new NewClass;

        instance.render(options, cb);
        OriginalViewClass.prototype.render.should.have.been.calledWithExactly(options, cb);
    });

  });

});