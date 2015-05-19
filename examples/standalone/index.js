var i18n = require('i18n-future')();

i18n.on('ready', function () {
    var en = i18n.translate('greeting', { lang: 'en' });
    console.log('English:', en);
    var fr = i18n.translate('greeting', { lang: 'fr' });
    console.log('French:', fr);
    var def = i18n.translate('greeting');
    console.log('Default fallback:', def);
});
