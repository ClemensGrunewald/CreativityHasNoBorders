var config            = require('./config');
var bodyParser        = require('body-parser');
var pug               = require('pug');
var cookieSession     = require('cookie-session');
var fileUpload        = require('express-fileupload');
var expressSanitizer  = require('express-sanitizer');
var validator         = require('validator');
const express         = require('express');
const app             = express();



//- Set up middleware
app.set('view engine', 'pug');
app.set('view options', { pretty: true });
app.locals.pretty = true;
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(expressSanitizer([{}]));
app.use(cookieSession({
  secret: config.sessionSecret,
  secure: false,
  httpOnly: true,
  maxAge: 30*24*60*60*1000
}))
app.use(fileUpload({preserveExtension: true}));

//- Require Routes
var routes = {};
routes.index    = require('./routes/index.js');
routes.user     = require('./routes/user.js');
routes.admin    = require('./routes/admin.js');
routes.auth     = require('./routes/auth.js');

//- Define Routes
app.use('/', routes.index);
app.use('/u/', routes.user);
app.use('/admin/', routes.admin);
app.use('/auth/', routes.auth);

//- 404 Error Page
app.get('*', function(req, res){
  res.json({error: "404"});
});

//- Start Server
app.listen(config.port, function(err) {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log('server is listening on '+config.port)
})
