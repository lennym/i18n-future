var glob = require('glob'),
    path = require('path'),
    fs = require('fs'),
    callsites = require('callsites'),
    findup = require('findup'),
    deepCloneMerge = require('deep-clone-merge'),
    async = require('async');


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

    options = Object.assign({
      path: 'locales/__lng__/__ns__.json'
    }, options);
    options.path = path.normalize(options.path);

    var glb = options.path.replace('__lng__', '[a-zA-Z\-_]*').replace('__ns__', '[a-zA-Z\-_]*');
    var rgx = options.path.replace('__lng__', '([a-zA-Z\-_]*)').replace('__ns__', '([a-zA-Z\-_]*)');
    rgx = rgx.split('\\').join('\\\\'); // Windows hack, noop for unix file paths
    rgx = new RegExp(rgx);

    // find language and namespace indexes in path matches
    var parts = options.path.match(rgx).slice(1);
    var lngIndex, nsIndex;
    parts.forEach(function (fragment, i) {
      if (fragment === '__lng__') lngIndex = i;
      if (fragment === '__ns__') nsIndex = i;
    });


    var dirs = [];

    function getDirs(done) {
      if (options.baseDir) {
        dirs = options.baseDir;
        if(!Array.isArray(dirs)) dirs = [ dirs ];
        return done();
      }

      getcallsite(function (err, baseDir) {
        if (err || !baseDir) {
          dirs = [ process.cwd() ];
        } else {
          dirs = [ baseDir ];
        }
        done();
      });
    }


    var files = [];

    function findFiles(done) {
      async.forEachSeries(dirs, function(dir, done) {
        var filePath = path.resolve(dir, glb);
        glob(filePath, function (err, filenames) {
          if (err) return done(err);
          filenames.forEach(function (filename) {
            filename = path.normalize(filename);
            var parts = filename.match(rgx).slice(1);

            var lng = parts[lngIndex];
            var ns = parts[nsIndex];

            if (lng && ns) {
              filename = path.resolve(dir, filename);
              files.push({ filename, lng, ns });
            }
          });
          done();
        });
      }, done);
    }


    var datastore = {};

    function readFiles(done) {
      async.forEach(files, function(file, done) {

        fs.readFile(file.filename, function (err, buffer) {
          if (err) return done(err);
          try {
            datastore[file.lng] = datastore[file.lng] || {};
            let data = JSON.parse(buffer.toString());
            datastore[file.lng][file.ns] = deepCloneMerge(data, datastore[file.lng][file.ns]);
          } catch(e) {
            return done(e);
          }
          done();
        });
      }, done);
    }


    async.series([
      getDirs,
      findFiles,
      readFiles
    ], function (err) {
      if (err) return callback(err);
      callback(null, datastore);
    });
  }
};
