var User = require('../models/user.js');
var Project = require('../models/project.js');
var Challenge = require('../models/challenge.js');


var middleware = {
  isAuthenticated: function(req, res, next){

    //- Check if user has a session cookie
    if(req.session.user && req.session.user.isAuthenticated){

      //- Find the user
      User.findOne({ username: req.session.user.username, email: req.session.user.email, access_token: req.session.user.token, access_token_expires: { $gt: Date.now() } }, function(err, user) {
        if(!user) {

          //- Make Session invalid
          req.session.user.isAuthenticated = false;

          //- Set Variables to Guest User
          req.user.username = "Guest";
          req.user.isAuthenticated = false;

        } else {
          req.user = user;
          next();
        }
      });

    //if user has an invalid token or no cookie at all -> Guest permissions
    } else {
      req.user.username = "Guest";
      req.user.isAuthenticated = false;
    }

  }
}

//- Export routes
module.exports = middleware;
