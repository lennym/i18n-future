'use strict';

const fs = require('fs');
const path = require('path');

const localisedView = {
    cache: {},

    getLocalisedFileList(filename, ext, views, langs, options) {
        ext = path.extname(filename) || ext;
        let dir = path.dirname(filename).replace(/^(\/|\\)/, '');
        let base = path.join(dir, path.basename(filename, ext));

        // filter to resolved files still within the view
        views = views
            .map(view => path.resolve(view))
            .filter(view => path.resolve(view, base).indexOf(view) === 0);

        let files = [];
        for (let lang of langs) {
            let file = base + '_' + lang + ext;
            for (let view of views) {
                const filePath = path.resolve(view, file);
                files.push({ file, filePath, cached: localisedView.cache[filePath] });
            }
        }
        return files;
    },

    existsFn: fs.exists,

    getFirstExistingFile(files, useCache, done) {
        const tryNextFile = () => {
            while(files.length) {
                let { file, filePath, cached } = files.shift();
                if (cached === false) continue;
                if (cached === true) return done(file);
                return localisedView.existsFn(filePath, exists => {
                    if (useCache) localisedView.cache[filePath] = exists;
                    if (!exists) return tryNextFile();
                    done(file);
                });
            }
            done();
        };

        tryNextFile();
    },

    mixin(Parent, views, translator, options) {
        return class LocalisedView extends Parent {
            render(options, callback) {
                const done = () => super.render(options, callback);

                if (!this.path) return done();

                let langs = translator.getLanguages({ lang: options.lang });

                let files = localisedView.getLocalisedFileList(this.path, this.ext || '.html', views, langs);

                localisedView.getFirstExistingFile(files, !options.noCache, file => {
                    if (file) this.name = this.path = file;
                    done();
                });
            }
        };
    }
};

module.exports = localisedView;
