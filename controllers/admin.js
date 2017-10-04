var User = require('../models/user.js');
var Project = require('../models/project.js');
var Challenge = require('../models/challenge.js');


//- Admin Page
module.exports.render_admin = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");
  res.redirect("/admin/users");
};

//- User Table
module.exports.render_admin_users = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");

  //- List Users (newest first)
  User.find({}).sort({updated_at:-1}).exec(function(err, users){
    console.log(users);
    res.render('admin/users',{ title: 'Admin Dashboard | Creativity Has No Borders', error:null, data: users})
  });

};

//- User Table block/unblock
module.exports.render_admin_users_block = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");

  //- Find User and invert his "isBlocked"-Status
  User.findOne({username: req.params.username}, function(err, user){
    User.update({username:req.params.username}, {$set:{isBlocked:!user.isBlocked}}, function(err, user){
      res.redirect("/admin/users");
    });
  });

};

//- User Table Edit Render
module.exports.render_admin_users_edit = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");

  User.findOne({username: req.params.username}, function(err, user){
    res.render('admin/user_edit',{ title: 'Admin Dashboard | Creativity Has No Borders', error:null, data: user})
  });

};

//- User Table Edit Process
module.exports.process_admin_users_edit = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");

  var updatedValues = {
    username: req.body.username,
    email: req.body.email,
    name: {
      first: req.body.first_name,
      last: req.body.last_name,
    },
    meta: {
      title: req.body.title,
      description: req.body.description,
      facebook: req.body.facebook,
      linkedin: req.body.linkedin,
      twitter: req.body.twitter,
      instagram: req.body.instagram,
      website: req.body.website,
    }
  }

  //- Find User and invert his "isBlocked"-Status
  User.findOne({username: req.params.username}, function(err, user){
    User.update({username:req.params.username}, {$set:updatedValues}, function(err, user){
      res.redirect("/admin/user/"+req.params.username+"/edit")
    });
  });

};


//- Challenge Tab
module.exports.render_admin_challenges = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");


};
