var glob = require('glob'),
    path = require('path'),
    fs = require('fs'),
    callsites = require('callsites'),
    findup = require('findup'),
    _ = require('lodash');


function getcallsite(cb) {
  var paths = callsites(),
      root = path.resolve(__dirname, '../../');

  // iterate over the call stack and find the first path that is not inside the i18n-future directory
  var source = paths
    .map(function (p) { return p.getFileName(); })
    .reduce(function (src, p) {
      if (src) {
        return src;
      } else if (path.resolve(root, p).indexOf(root) < 0) {
        return p;
      }
    }, null);

    // if such a path is found, then findup from that path to a directory containing a package.json
    if (source) {
      findup(source, 'package.json', cb);
    } else {
      cb();
    }
}

module.exports = {
  load: function (options, callback) {
    if (arguments.length === 1 && typeof options === 'function') {
      callback = options;
      options = {};
    }

    options = _.extend({
      path: 'locales/__lng__/__ns__.json'
    }, options);

    function load() {
      // Replace / with \\ on Windows
      options.path = path.normalize(options.path);

      var datastore = {};

      var glb = options.path.replace('__lng__', '[a-zA-Z\-_]*').replace('__ns__', '[a-zA-Z\-_]*'),
          rgx = options.path.replace('__lng__', '([a-zA-Z\-_]*)').replace('__ns__', '([a-zA-Z\-_]*)');

      // Windows hack, noop for unix file paths
      rgx = rgx.split('\\').join('\\\\');

      glb = path.resolve(options.baseDir, glb);

      rgx = new RegExp(rgx);

      glob(glb, function (err, files) {
        if (err) { return callback(err); }

        var count = files.length;

        if (files.length === 0) {
          return callback(null, datastore);
        }

        function checkDone() {
          count--;
          if (count === 0) {
            callback(null, datastore);
          }
        }

        files.forEach(function (file) {
          // file comes in as a glob format with unix-style path separators on Windows
          file = path.normalize(file);

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


    if (!options.baseDir) {
      getcallsite(function (err, baseDir) {
        if (err || !baseDir) {
          options.baseDir = process.cwd();
        } else {
          options.baseDir = baseDir;
        }
        load();
      });
    } else {
      load();
    }

  }
};
