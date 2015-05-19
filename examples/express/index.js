var app = require('express')();

var i18n = require('i18n-future').middleware();

app.use(i18n);

app.get('/', function (req, res) {
    // a translate method is now available on the request
    // this will translate keys according to the language request headers
    res.json({
        greeting: req.translate('greeting') + ' ' + req.translate('name.first')
    });
});

app.listen(3000);
console.log('Server listening on port 3000');
console.log('Try running `curl localhost:3000 -H "Accept-Language: fr"`');
