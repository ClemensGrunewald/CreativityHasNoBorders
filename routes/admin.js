var User = require('../models/user.js');
var Project = require('../models/project.js');
var Challenge = require('../models/challenge.js');
var middleware = require('./middleware.js');
var express = require('express');
var router = express.Router();

var controller = require('../controllers/admin');

//- Render Routes
router.get('/', middleware.isAuthenticated, controller.render_admin);

router.get('/new', middleware.isAuthenticated, controller.render_challenge_new);

router.post('/new', middleware.isAuthenticated, controller.process_challenge_new);

router.get('/:challengeId/edit', middleware.isAuthenticated, controller.render_challenge_edit);

router.post('/:challengeId/edit', middleware.isAuthenticated, controller.process_challenge_edit);

//- Export routes
module.exports = router;
