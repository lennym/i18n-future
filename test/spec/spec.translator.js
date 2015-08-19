var Translator = require('../../').Translator;

describe('Translator', function () {

  var translator, backend;

  beforeEach(function () {
    backend = require('../helpers/stub-backend')();
    translator = new Translator({
      backend: backend
    });
  });

  describe('backend', function () {

    it('throws if passed a backend without a `load` method', function () {
      var fn = function () {
        return new Translator({ backend: {} });
      }
      fn.should.throw();
    });

    it('calls backend.load on initialisation', function () {
      backend.load.should.have.been.calledOnce;
    });

    it('emits a ready event on backend callback', function () {
      var cb = sinon.stub();
      translator.on('ready', cb);
      cb.should.not.have.been.called;
      backend.load.yield(null, {});
      cb.should.have.been.calledOnce;
    });

  });

  describe('ready event', function () {

    it('calls handler immediately if ready event has been emitted already', function (done) {
      translator.emit('ready');
      translator.on('ready', function () {
        done();
      });
    });

  });

  describe('translate', function () {

    beforeEach(function () {
      backend.load.yield(null, require('../stubs/simple'));
    });

    it('does a basic lookup', function () {
      translator.translate('name.first').should.equal('John');
    });

    it('returns the first matched key if an array of keys is passed', function () {
      translator.translate(['name.first', 'name.last']).should.equal('John');
    });

    describe('languages', function () {

      it('takes an optional language parameter', function () {
        translator.translate('name.first', { lang: 'fr' }).should.equal('Jean');
      });

      it('falls back to less specific language if a specific language is provided', function () {
        translator.translate('name.first', { lang: 'en-GB' }).should.equal('John');
        translator.translate('name.last', { lang: 'en-GB' }).should.equal('Smith');
      });

      it('supports a list of languages being provided', function () {
        translator.translate('name.first', { lang: ['de'] }).should.equal('Franz');
        translator.translate('name.first', { lang: ['es', 'de'] }).should.equal('Franz');
      });

    });

    describe('namespaces', function () {

      beforeEach(function () {
        translator.reload();
        backend.load.yield(null, require('../stubs/namespaces'));
      });

      it('takes an optional namespace parameter', function () {
        translator.translate('name.last', { namespace: 'beatles' }).should.equal('Lennon');
      });

      it('falls back to default namespace if none is provided', function () {
        translator.translate('name.last').should.equal('Smith');
      });

    });

    describe('default values', function () {

      it('returns the defined default value if one is provided', function () {
        translator.translate('not.a.key', { default: 'Hello World' }).should.equal('Hello World');
      });

      it('returns the key passed if only passed a single key and no default option', function () {
        translator.translate('not.a.key').should.equal('not.a.key');
      });

      it('returns the first key if passed multiple keys and no default option', function () {
        translator.translate(['not.a.key', 'also.not.a.key']).should.equal('not.a.key');
      });

      it('falls back to default language if unknown language is passed', function () {
        translator.translate('name.last', { lang: 'not-a-language' }).should.equal('White');
      });

      it('does not add extra langauges to fallback langs on subsequent calls - BUGFIX', function () {
        translator.translate('name.first', { lang: 'fr' }).should.equal('Jean');
        translator.translate('name.first').should.equal('John');
      });

    });

    describe('pre-defined resources', function () {

      beforeEach(function () {
        translator = new Translator({
          backend: backend,
          resources: require('../stubs/predefined')
        });
        backend.load.yield(null, require('../stubs/simple'));
      });

      it('includes translations from the pre-defined resources', function () {
        translator.translate('predef').should.equal('true');
        translator.translate('predef', { lang: 'fr' }).should.equal('vrai');
      });

      it('includes translations from resources loaded from backend', function () {
        translator.translate('name.first', { lang: 'fr' }).should.equal('Jean');
        translator.translate('name.first').should.equal('John');
      });

      it('does not mutate the pre-defined resources', function () {
        require('../stubs/predefined').en.default.should.not.have.property('name');
      });

    });

  });

});