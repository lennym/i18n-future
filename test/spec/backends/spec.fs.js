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

});