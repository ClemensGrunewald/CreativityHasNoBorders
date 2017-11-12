var config          = require('../config');
var User            = require('../models/user.js');
var Project         = require('../models/project.js');
var Challenge       = require('../models/challenge.js');

//- Admin Page
module.exports.render_admin = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");
  res.redirect("/admin/users");
};



//- User Table
module.exports.render_admin_users = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");

  //- List Users (newest first)
  User.find({}).sort({created_at:-1}).exec(function(err, users){
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
  Challenge.find({active_until: { $gte: new Date().toISOString() }}).sort({active_until:1}).exec(function(err, challenges){

    //- Make data readable for humans again
    challenges.forEach(function(challenge){
      if(challenge.cover != '') challenge.cover = config.host+"/"+challenge.cover;
      if(challenge.brief != '') challenge.brief = config.host+"/"+challenge.brief;
      challenge.active_til = challenge.active_until.getDate()+"."+(challenge.active_until.getMonth()+1)+"."+challenge.active_until.getFullYear();
    });

    res.render('admin/challenges',{ title: 'Admin Dashboard | Creativity Has No Borders', error:null, data: challenges})
  });
};

//- Challenge New Render
module.exports.render_admin_challenges_new = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");
  res.render('admin/challenge_new',{ title: 'Admin Dashboard | Creativity Has No Borders', error:null, data: null})
};

//- Challenge New Process
module.exports.process_admin_challenges_new = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");

  //- Check if required fields are available
  if(!(req.body.title && req.body.author && req.body.description && req.body.active_until)){
    res.render('admin/challenge_new',{ title: 'Admin Dashboard | Creativity Has No Borders', error:"Error: Please fill in all required fields.", data: {input:req.body}})
    return;
  }

  //- Verify date Variable
  var active_until = req.body.active_until.split(".");
  if(active_until.length != 3 || (parseInt(active_until[0])>31 || parseInt(active_until[1])>12 || parseInt(active_until[2])<new Date().getFullYear() ) ){
    res.render('admin/challenge_new',{ title: 'Admin Dashboard | Creativity Has No Borders', error:"Error: The expiration date of the challange needs to be in the format DD.MM.YYYY.", data: {input:req.body}})
    return;
  }

  //- Challenge Data
  var c = {}
  c.meta = {};
  c.shortMode = {};
  c.name = req.sanitize(req.body.title).replace(/[&\/\\#,!=+()$~%.'":*?<>{}]/g,'').replace(/ /g,"-").replace(/_/g,"-").toLowerCase();
  c.title = req.sanitize(req.body.title);
  c.author = req.sanitize(req.body.author);
  c.description = req.sanitize(req.body.description);
  c.brief = '';
  c.active_until = new Date(active_until[2], active_until[1] - 1, active_until[0]);
  if(!req.body.active) c.isActive = false;
  if(req.body.switch === 'on' && parseInt(req.body.countdown.replace(/[^0-9.]/g,"")) > 0){
    c.shortMode.enabled = true;
    c.shortMode.countdown = parseInt(req.sanitize(req.body.countdown).replace(/[^0-9.]/g,""));
  }
  if(req.files.cover) cover = req.files.cover;
  if(req.files.brief) brief = req.files.brief;

  //- Check if Challenge-name already exists
  Challenge.find({name: c.name}, function(err, challenge) {

    //- If it already exists, update name and add random characters to it
    if(challenge.length > 0){
      c.name = c.name+"-"+Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    }

    //- Create a new Challenge
    var newChallenge = new Challenge(c);

    //- Save the new Challenge
    newChallenge.save(function(err) {
      if (err) {
        res.render('admin/challenge_new',{ title: 'Admin Dashboard | Creativity Has No Borders', error:"Error: Your inputs could not be saved to tha database. Please try again.", data: {input:req.body}})
        return;
      }

      //- Save Files to filesystem
      //- Save cover image
      if(req.files.cover) {
        var extension = cover.name.substr(cover.name.length - 4).toLowerCase();
        if(extension === ".png" || extension === ".jpg" || extension === ".gif" || extension === "jpeg"){
          var path_cover = 'uploads/challenges/'+c.name+"-cover"+cover.name.substr(cover.name.length - 4)
          cover.mv('public/'+path_cover, function(err) {
            Challenge.update({name: c.name},{ $set: {cover: path_cover}}, {multi: false}, function(err, challenge) {});
          });
        }
      }

      //- Save brief
      if(req.files.brief) {
        var extension = cover.name.substr(cover.name.length - 4).toLowerCase();
        if(extension === ".pdf"){
          var path_brief = 'uploads/challenges/'+c.name+"-brief"+brief.name.substr(brief.name.length - 4)
          brief.mv('public/'+path_brief, function(err) {
            Challenge.update({name: c.name},{ $set: {brief: path_brief}}, {multi: false}, function(err, challenge) {});
          });
        }
      }

      //- Redirect at success
      res.redirect('/admin/challenges/'+c.name+'/edit');
    });

  });




};

//- Challenge Edit Render
module.exports.render_admin_challenges_edit = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");

  Challenge.findOne({name: req.sanitize(req.params.challenge)}, function(err, challenge) {
    //- Errorhandling
    if(err || challenge === "null") {
      res.redirect("/error");
      return;
    }

    //- Make data readable for humans again
    if(challenge.cover != '') challenge.cover = config.host+"/"+challenge.cover;
    if(challenge.brief != '') challenge.brief = config.host+"/"+challenge.brief;
    challenge.active_til = challenge.active_until.getDate()+"."+(challenge.active_until.getMonth()+1)+"."+challenge.active_until.getFullYear();

    //- Send data to Frontend
    res.render('admin/challenge_edit',{ title: 'Admin Dashboard | Creativity Has No Borders', error:null, data: challenge})
  });

};

//- Challenge Edit Process
module.exports.process_admin_challenges_edit = function(req, res) {
  if(!req.user.isAdmin) res.redirect("/");
  console.log(req.body);
  console.log(req.files);

  //- Check if required fields are available
  if(!(req.body.title && req.body.author && req.body.description && req.body.active_until)){
    res.render('admin/challenge_new',{ title: 'Admin Dashboard | Creativity Has No Borders', error:"Error: Please fill in all required fields.", data: {input:req.body}})
    return;
  }

  //- Verify Date Variable
  var active_until = req.body.active_until.split(".");
  if(active_until.length != 3 || (parseInt(active_until[0])>31 || parseInt(active_until[1])>12 || parseInt(active_until[2])<new Date().getFullYear() ) ){
    res.render('admin/challenge_new',{ title: 'Admin Dashboard | Creativity Has No Borders', error:"Error: The expiration date of the challange needs to be in the format DD.MM.YYYY.", data: {input:req.body}})
    return;
  }

  //- Challenge Data
  var c = {}
  c.meta = {};
  c.shortMode = {};
  c.name = req.sanitize(req.params.challenge);
  c.title = req.sanitize(req.body.title);
  c.author = req.sanitize(req.body.author);
  c.description = req.sanitize(req.body.description);
  c.brief = '';
  c.active_until = new Date(active_until[2], active_until[1] - 1, active_until[0]);
  if(!req.body.active) c.isActive = false;
  if(req.body.active) c.isActive = true;
  if(!req.body.switch){
    c.shortMode.enabled = false;
    c.shortMode.countdown = 0;
  }
  if(req.body.switch === 'on' && parseInt(req.body.countdown.replace(/[^0-9.]/g,"")) > 0){
    c.shortMode.enabled = true;
    c.shortMode.countdown = parseInt(req.sanitize(req.body.countdown).replace(/[^0-9.]/g,""));
  }
  if(req.files.cover) cover = req.files.cover;
  if(req.files.brief) brief = req.files.brief;


  //- Check if the challenge exists
  Challenge.findOne({name: c.name}, function(err, challenge) {
    //- Errorhandling
    if(err || challenge === "null") {
      res.redirect("/error");
      return;
    }

    //- Update the Challenge
    Challenge.update({name: c.name}, {$set:c}, {multi:false}, function(err, challenge) {

      //- Save Cover
      if(req.files.cover) {
        var extension = cover.name.substr(cover.name.length - 4).toLowerCase();
        if(extension === ".png" || extension === ".jpg" || extension === ".gif" || extension === "jpeg"){
          var path_cover = 'uploads/challenges/'+c.name+"-cover"+cover.name.substr(cover.name.length - 4)
          cover.mv('public/'+path_cover, function(err) {
            Challenge.update({name: c.name},{ $set: {cover: path_cover}}, {multi: false}, function(err, challenge) {});
          });
        }
      }

      //- Save brief
      if(req.files.brief) {
        var extension = brief.name.substr(brief.name.length - 4).toLowerCase();
        console.log(extension);
        if(extension === ".pdf"){
          var path_brief = 'uploads/challenges/'+c.name+"-brief"+brief.name.substr(brief.name.length - 4)
          brief.mv('public/'+path_brief, function(err) {
            Challenge.update({name: c.name},{ $set: {brief: path_brief}}, {multi: false}, function(err, challenge) {});
          });
        }
      }

      //- Redirect at success
      res.redirect('/admin/challenges/'+c.name+'/edit');
    });

  });
};
