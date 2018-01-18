var config          = require('../config');
var User            = require('../models/user.js');
var Project         = require('../models/project.js');
var Challenge       = require('../models/challenge.js');
var crypto          = require('crypto');

//- Admin Page
module.exports.render_admin = function(req, res) {
  if(!req.user.isAdmin && !req.user.isMod) res.redirect("/");

    Challenge.find({active_until: { $gte: new Date().toISOString() }}).sort({active_until:1}).exec(function(err, challenges){
      Project.find({isBlocked: true}, function(err, projects){
        if(err || !projects) return res.redirect("/u/"+req.params.username+"/"+req.params.projectId);
        res.render('admin/admin',{ title: 'Admin Dashboard | Creativity Has No Borders', error:null, data: {user: req.user, challenges:challenges, projects: projects}})
      });

    });

};

//- GET Render New Challenge
module.exports.render_challenge_new = function(req, res) {
  if(!req.user.isAdmin && !req.user.isMod) res.redirect("/");
  res.render('admin/challenge_new',{ title: 'Admin Dashboard | Creativity Has No Borders', error:null, data: {user: req.user, challenge: null}});
};

//- POST Process New Challenge
module.exports.process_challenge_new = function(req, res) {
  if(!req.user.isAdmin && !req.user.isMod && !req.user.isAgencyUser) res.redirect("/");

  var challenge = {};
  challenge.name = req.sanitize(req.body.title).replace(/[&\/\\#,!=+()$~%.'":*?<>{}]/g,'').replace(/ /g,"-").replace(/_/g,"-").toLowerCase();
  challenge.title = req.sanitize(req.body.title);
  challenge.author = req.sanitize(req.body.author);
  if(req.body.shortModeSwitch === 'on'){
    challenge.shortMode = {};
    challenge.shortMode.enabled = true;
    challenge.shortMode.countdown = parseInt(req.sanitize(req.body.countdown).replace(/\D/g, ""));
  }
  challenge.description = req.sanitize(req.body.description);
  challenge.active_until = req.sanitize(req.body.active_until).split(".");
  challenge.active_until = new Date(challenge.active_until[2], challenge.active_until[1] - 1, challenge.active_until[0]);
  if(req.body.active === 'off') challenge.isActive = false;


  Challenge.find({name: challenge.name}, function(err, c) {
    if(err || !c) return res.render('admin/challenge_new',{ title: 'Admin Dashboard | Creativity Has No Borders', error:"Something went wrong", data: {user: req.user}});

    //- If it already exists, update name and add random characters to it
    if(c.length > 0){
      challenge.name = challenge.name+"-"+Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    }

    //- Upload Brief & Write everything into the Database
    if(req.files.brief) {
      var file = req.files.brief;
      file.name = file.name.toLowerCase();
      file.extension = file.name.substr(file.name.lastIndexOf('.')+1);
      file.name = challenge.name+"_"+crypto.randomBytes(5).toString('hex')+"."+file.extension;
      if(file.extension === 'pdf'){
        file.mv('public/uploads/challenges/'+file.name, function(err) {
          challenge.brief = 'uploads/challenges/'+file.name;
          var newChallenge = new Challenge(challenge);
            //- Save the new Challenge
            newChallenge.save(function(err) {
              res.redirect("/admin/");
            });
        });
      }
    } else {
      res.render('admin/challenge_new',{ title: 'Admin Dashboard | Creativity Has No Borders', error:"Something went wrong", data: {user: req.user}});
    }
  });
};

//- GET Render Challenge Edit
module.exports.render_challenge_edit = function(req, res) {
  if(!req.user.isAdmin && !req.user.isMod && !req.user.isAgencyUser) res.redirect("/");

  Challenge.findOne({name: req.sanitize(req.params.challengeId)}, function(err, challenge) {
    if(err || !challenge) return res.redirect("/admin/");
    challenge.active_until_string = pad(challenge.active_until.getDate())+"."+pad(challenge.active_until.getMonth()+1)+"."+challenge.active_until.getFullYear();
    res.render('admin/challenge_edit',{ title: 'Admin Dashboard | Creativity Has No Borders', error:null, data: {user: req.user, challenge: challenge}});
  });

};

//- POST Process Challenge Edit
module.exports.process_challenge_edit = function(req, res) {
  if(!req.user.isAdmin && !req.user.isMod && !req.user.isAgencyUser) res.redirect("/");

  Challenge.findOne({name: req.sanitize(req.params.challengeId)}, function(err, challenge) {
    if(err || !challenge) return res.redirect("/admin/");

    challenge.title = req.sanitize(req.body.title);
    challenge.author = req.sanitize(req.body.author);
    if(req.body.shortModeSwitch === 'on'){
      challenge.shortMode.enabled = true;
      challenge.shortMode.countdown = parseInt(req.sanitize(req.body.countdown).replace(/\D/g, ""));
    } else {
      challenge.shortMode.enabled = false;
    }
    challenge.description = req.sanitize(req.body.description);
    var active_until = req.sanitize(req.body.active_until).split(".");
    challenge.active_until = new Date(active_until[2], active_until[1] - 1, active_until[0]);
    if(req.body.active === 'on') {
      challenge.isActive = true;
    } else {
      challenge.isActive = false;
    }


    //- Upload Brief & Write everything into the Database
    if(req.files.brief) {
      var file = req.files.brief;
      file.name = file.name.toLowerCase();
      file.extension = file.name.substr(file.name.lastIndexOf('.')+1);
      file.name = challenge.name+"_"+crypto.randomBytes(5).toString('hex')+"."+file.extension;
      if(file.extension === 'pdf'){
        file.mv('public/uploads/challenges/'+file.name, function(err) {
          challenge.brief = 'uploads/challenges/'+file.name;
          Challenge.update({name: challenge.name}, {$set: challenge}, function(){
            res.redirect("/admin/"+challenge.name+"/edit");
          });
        });
      }
    } else {
      Challenge.update({name: challenge.name}, {$set: challenge}, function(err){
        res.redirect("/admin/"+challenge.name+"/edit");
      });
    }


  });

};


function pad(n){
    return n > 9 ? "" + n: "0" + n;
}
