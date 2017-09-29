var cookieSession   = require('cookie-session');
var express = require('express');
var router = express.Router();


//- Controller
var controller = require('../controllers/auth');


//- Process Routes
router.get('/login', controller.render_login)

router.post('/login', controller.process_login)

router.get('/register', controller.render_register)

router.post('/register', controller.process_register)

router.get('/confirmation/:token', controller.process_confirmation)

router.get('/password-reset', controller.render_password_reset)

router.post('/password-reset', controller.process_password_reset)

router.get('/password-reset/:token', controller.render_password_reset_new)

router.post('/password-reset/:token', controller.process_password_reset_new)


//- Export routes
module.exports = router;
