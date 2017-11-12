var middleware = require('./middleware.js');
var express = require('express');
var router = express.Router();

var controller = require('../controllers/index');

//- Render Routes
router.get('/', middleware.isAuthenticated, controller.render_index);

router.get('/portfolios', middleware.isAuthenticated, controller.render_portfolios)

/*router.get('/challenges', middleware.isAuthenticated, controller.render_challanges)

router.get('/about', middleware.isAuthenticated, controller.render_about)

router.get('/partners', middleware.isAuthenticated, controller.render_register)

router.get('/imprint', middleware.isAuthenticated, controller.render_imprint)

router.get('/privacy', middleware.isAuthenticated, controller.render_privacy)

*/


//- Redirect Routes
router.get('/login', controller.redirect_login);
router.get('/register', controller.redirect_register);
router.get('/signup', controller.redirect_register);
router.get('/logout', controller.redirect_logout);


//- Export routes
module.exports = router;
