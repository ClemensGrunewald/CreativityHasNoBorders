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

//- Method to block or unblock a given user
router.get('/user/:username/block', middleware.isAuthenticated, controller.render_admin_users_block);

//- Methods to access and edit userdata (show user)
router.get('/user/:username/edit', middleware.isAuthenticated, controller.render_admin_users_edit);

//- Methods to access and edit userdata (process)
router.post('/user/:username/edit', middleware.isAuthenticated, controller.process_admin_users_edit);


//- Render Challenges Tab
router.get('/challenges', middleware.isAuthenticated, controller.render_admin_challenges);

//- Method to create a new Challenge
router.get('/challenges/new', middleware.isAuthenticated, controller.render_admin_challenges_new);

//- Method to process the data of a new Challenge
router.post('/challenges/new', middleware.isAuthenticated, controller.process_admin_challenges_new);

//- Method to edit an existing challenge
router.get('/challenges/:challenge/edit', middleware.isAuthenticated, controller.render_admin_challenges_edit);

//- Method to process the data of an edited challenge
router.post('/challenges/:challenge/edit', middleware.isAuthenticated, controller.process_admin_challenges_edit);


//- Export routes
module.exports = router;
