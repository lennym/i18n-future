var backend = require('../../../lib/backends/fs');
var path =  require('path');

describe('fs backend', function () {

  it('exports a load function', function () {
    backend.load.should.be.a('function');
  });

  describe('default behaviour', function () {

    it('loads json files from default location', function (done) {
      backend.load(function (err, data) {
        data.en.should.eql({
          test: {
            name: 'John',
            deep: {
              object: 'English'
            }
          }
        });
        data.fr.should.eql({
          test: {
            name: 'Jean',
            deep: {
              object: 'French'
            }
          }
        });
        done();
      });
    });

  });

  describe('with options', function () {

    it('can handle a path created with path.resolve', function (done) {
      backend.load({
        path: path.resolve(__dirname, '../../../locales/__lng__/__ns__.json')
      }, function (err, data) {
        data.should.have.property('en');
        data.should.have.property('fr');
        done();
      });
    });

    it('can handle a path created with path.join', function (done) {
      backend.load({
        path: path.join(__dirname, '../../../locales/__lng__/__ns__.json')
      }, function (err, data) {
        data.should.have.property('en');
        data.should.have.property('fr');
        done();
      });
    });

    it('uses the baseDir from options', function (done) {
      backend.load({
        baseDir: path.resolve(__dirname)
      }, function (err, data) {
        data.should.have.property('en');
        data.should.have.property('de');
        done();
      });
    });

    it('uses a baseDir array from options', function (done) {
      backend.load({
        baseDir: [
          path.resolve(__dirname),
          path.resolve(__dirname, '../../../')
        ]
      }, function (err, data) {
        data.en.should.eql({
          test: {
            name: 'Jack',
            deep: {
              object: 'Other English'
            }
          }
        });
        data.fr.should.eql({
          test: {
            name: 'Jean',
            deep: {
              object: 'French'
            }
          }
        });
        data.de.should.eql({
          test: {
            name: 'Hans',
            deep: {
              object: 'German'
            }
          }
        });
        done();
      });
    });

  });

  describe('when no resources exist', function () {

    it('calls back with an empty datastore', function (done) {
      backend.load({
        path: './not-a-real-location/__lng__/__ns__.json'
      }, function (err, data) {
        data.should.eql({});
        done();
      });
    });

  });

});