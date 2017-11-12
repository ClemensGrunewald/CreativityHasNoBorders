var middleware = require('./middleware.js');
var cookieSession   = require('cookie-session');
var express = require('express');
var router = express.Router();


//- Controller
var controller = require('../controllers/auth');


//- Process Routes
router.get('/login', middleware.isAuthenticated, controller.render_login)

router.post('/login', controller.process_login)

router.get('/register', middleware.isAuthenticated, controller.render_register)

router.post('/register', controller.process_register)

router.get('/confirmation/:token', middleware.isAuthenticated, controller.process_confirmation)

router.get('/password-reset', middleware.isAuthenticated, controller.render_password_reset)

router.post('/password-reset', controller.process_password_reset)

router.get('/password-reset/:token', middleware.isAuthenticated, controller.render_password_reset_new)

router.post('/password-reset/:token', controller.process_password_reset_new)

router.get('/logout', middleware.isAuthenticated, controller.render_logout);

//- Export routes
module.exports = router;
