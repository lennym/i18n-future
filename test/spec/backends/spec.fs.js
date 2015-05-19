var backend = require('../../../lib/backends/fs');

describe('fs backend', function () {

  it('exports a load function', function () {
    backend.load.should.be.a('function');
  });

  describe('default behaviour', function () {

    it('loads json files from default location', function (done) {
      backend.load(function (err, data) {
        data.en.should.eql({
          test: {
            name: 'John'
          }
        });
        data.fr.should.eql({
          test: {
            name: 'Jean'
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