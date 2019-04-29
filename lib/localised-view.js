'use strict';

const fs = require('fs');
const path = require('path');

const localisedView = {

    getLocalisedFileList(filename, views, langs) {
        let ext = path.extname(filename);
        let dir = path.dirname(filename).replace(/^(\/|\\)/, '');
        let base = path.basename(filename, ext);

        // later views override earlier views
        views = views.reverse();

        let files = [];
        for (let lang of langs) {
            for (let view of views) {
                let filename = path.resolve(view, dir, base + '_' + lang + ext);
                files.push(path.resolve(view, dir, base + '_' + lang + ext));
            }
        }
        return files;
    },

    existsFn: fs.exists,

    getFirstExistingFile(files, done) {
        const tryNextFile = () => {
            if (!files.length) return done();  
            let file = files.shift();
            localisedView.existsFn(file, exists => {
                if (!exists) tryNextFile();
                done(file);
            });
        };

        tryNextFile();
    },

    mixin(Parent, views, translator) {
        return class LocalisedView extends Parent {
            render(options, callback) {
                const done = () => super.render(options, callback);

                if (!this.path) return done();

                let langs = translator.getLanguages({ lang: options.lang });

                let files = localisedView.getLocalisedFileList(this.path, views, langs);

                localisedView.getFirstExistingFile(files, file => {
                    if (file) this.path = file;
                    done();
                })
            }
        };
    }
};

module.exports = localisedView;
