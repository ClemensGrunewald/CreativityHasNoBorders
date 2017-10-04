var User = require('../models/user.js');
var Project = require('../models/project.js');
var Challenge = require('../models/challenge.js');
var middleware = require('./middleware.js');
var express = require('express');
var router = express.Router();

//- Routes
router.get('/:username',middleware.isAuthenticated, function(req, res){
  console.log(req.user);

  //- Get projectlist of the user to display on the profile page
  /*Project.find({ username: req.params.username }, function(err, projects) {

  });*/




  //- If user is logged in and owner of the requested profile
  if(req.params.username === req.user.username && req.session.user.isAuthenticated){


  }

  //- if user is a registered and logged in member
  if(req.session.user.isAuthenticated){

  }

  //- if user is a Guest user
  if(!req.session.user.isAuthenticated){

  }




  res.json({ hello: req.params.username });

})

//- Routes
router.get('/:username/:projectId', function(req, res){
  //- checks if user is authenticated
  isAuthenticated(req,res, function(user){
    res.json({ hello: user.username, projectId: req.params.projectId });
  })

})


//- Export routes
module.exports = router;

/*: function(req, res, next){
    console.log('private route list!');
    next();

  //- Check if user has a session cookie
  if(req.session.user){
    console.log(req.session.user);

    //- Find the user
    User.findOne({ username: req.session.user.username, email: req.session.user.email, access_token: req.session.user.token, access_token_expires: { $gt: Date.now() } }, function(err, user) {
      if(!user) {
        req.session.user.isAuthenticated = false;
        return res.redirect("/auth/login");
      } else {
        callback(user);
      }
    });

  }
}*/


function isAdmin(){
  return next();
}
