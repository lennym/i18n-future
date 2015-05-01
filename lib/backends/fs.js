var glob = require('glob'),
    path = require('path'),
    fs = require('fs'),
    _ = require('lodash');

module.exports = {
  load: function (options, callback) {

    if (arguments.length === 1 && typeof options === 'function') {
      callback = options;
      options = {};
    }

    options = _.extend({
      path: 'locales/__lng__/__ns__.json',
      baseDir: process.cwd()
    }, options);

    var datastore = {};

    var glb = options.path.replace('__lng__', '[a-zA-Z\-_]*').replace('__ns__', '[a-zA-Z\-_]*'),
        rgx = options.path.replace('__lng__', '([a-zA-Z\-_]*)').replace('__ns__', '([a-zA-Z\-_]*)');

    glb = path.join(options.baseDir, glb);

    rgx = new RegExp(rgx);

    glob(glb, function (err, files) {
      if (err) { return callback(err); }

      var count = files.length;

      function checkDone() {
        count--;
        if (count === 0) {
          callback(null, datastore);
        }
      }

      files.forEach(function (file) {
        var parts = file.match(rgx).slice(1),
            src = options.path.match(rgx).slice(1);

        var lng, ns;
        parts.forEach(function (fragment, i) {
          if (src[i]) {
            if (src[i] === '__lng__') {
              lng = fragment;
            } else if (src[i] === '__ns__') {
              ns = fragment;
            }
          }
        });

        if (lng && ns) {
          fs.readFile(path.resolve(options.baseDir, file), function (err, buffer) {
            if (err) {
              checkDone();
            } else {
              try {
                datastore[lng] = datastore[lng] || {};
                datastore[lng][ns] = JSON.parse(buffer.toString());
                checkDone();
              } catch(e) {
                checkDone();
              }
            }
          });
        } else {
          checkDone();
        }
      });

    });

  }
};
