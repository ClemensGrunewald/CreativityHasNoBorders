var middleware = require('./middleware.js');
var express = require('express');
var router = express.Router();

//- Controller for user
var controller = require('../controllers/user');


//- GET User Profile Page
router.get('/:username', middleware.isAuthenticated, controller.render_user);

//- GET User Edit Page
router.get('/:username/edit', middleware.isAuthenticated, controller.render_user_edit);

//- POST User Edit Page
router.post('/:username/edit', middleware.isAuthenticated, controller.process_user_edit);

//- GET Block/Unblock User
router.get('/:username/block', middleware.isAuthenticated, controller.user_un_block);

//- GET Block/Unblock User
router.get('/:username/delete', middleware.isAuthenticated, controller.user_delete);

//- GET Upload New Case Page
router.get('/:username/new', middleware.isAuthenticated, controller.render_project_new);

//- POST Upload New Case Page
router.post('/:username/new', middleware.isAuthenticated, controller.process_project_new);

//- GET Project Page
router.get('/:username/:projectId', middleware.isAuthenticated, controller.render_project);

//- GET Project Page Edit
router.get('/:username/:projectId/edit', middleware.isAuthenticated, controller.render_project_edit);

//- POST Project Page Edit
router.post('/:username/:projectId/edit', middleware.isAuthenticated, controller.process_project_edit);

//- GET Project Page Report
router.get('/:username/:projectId/report', middleware.isAuthenticated, controller.project_report);

//- POST Project Page Report via AJAX
router.post('/:username/:projectId/ajaxreport', middleware.isAuthenticated, controller.project_ajax_report);

//- GET Project Page unblock
router.get('/:username/:projectId/unblock', middleware.isAuthenticated, controller.project_unblock);

//- GET Project Page Delete
router.get('/:username/:projectId/delete', middleware.isAuthenticated, controller.project_delete);

//- POST Project add like
router.post('/:username/:projectId/like', middleware.isAuthenticated, controller.project_like);

//- POST Project add comment
router.post('/:username/:projectId/comment', middleware.isAuthenticated, controller.project_comment);

//- GET Delete Comment
router.get('/:username/:projectId/:commentId/delete', middleware.isAuthenticated, controller.project_comment_delete);


//- Export routes
module.exports = router;
