var User      = require('../models/user.js');


//- Users Page
module.exports.render_user = function(req, res) {

  //- Get Profile Information
  User.findOne({username: req.sanitize(req.params.username)}, function(err,user){
    if(err || user === null){
      res.redirect("/error");
      return;
    }


    //- Get Projects


    res.render('user/profile',{ title: 'Creativity Has No Borders', error:null, data: {user: req.user, profile: user, projects: {} } })
  });

};
