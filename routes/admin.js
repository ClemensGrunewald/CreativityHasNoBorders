var User = require('../models/user.js');
var Project = require('../models/project.js');
var Challenge = require('../models/challenge.js');
var middleware = require('./middleware.js');
var express = require('express');
var router = express.Router();

var controller = require('../controllers/admin');

//- Render Routes
router.get('/', middleware.isAuthenticated, controller.render_admin);

//- Render User Table
router.get('/users', middleware.isAuthenticated, controller.render_admin_users);

//-method to block or unblock a given user
router.get('/user/:username/block', middleware.isAuthenticated, controller.render_admin_users_block);

//- Methods to access and edit userdata (show user)
router.get('/user/:username/edit', middleware.isAuthenticated, controller.render_admin_users_edit);

//- Methods to access and edit userdata (process)
router.post('/user/:username/edit', middleware.isAuthenticated, controller.process_admin_users_edit);











//- Export routes
module.exports = router;
