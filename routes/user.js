var middleware = require('./middleware.js');
var express = require('express');
var router = express.Router();

//- Controller for user
var controller = require('../controllers/user');


//- Render Routes
router.get('/:username', middleware.isAuthenticated, controller.render_user);

//- Routes
router.get('/:username/:projectId', middleware.isAuthenticated, function(req, res){
  //- checks if user is authenticated
  res.json({project: req.params.projectId});
})


//- Export routes
module.exports = router;
