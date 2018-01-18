var config          = require('../config');
var User            = require('../models/user.js');
var Project         = require('../models/project.js');
var Challenge       = require('../models/challenge.js');

//- Index Page
module.exports.render_index = function(req, res) {
  if(req.user.isAuthenticated === false) return res.render('index/index',{ title: 'Creativity Has No Borders', error:null, data: {user: req.user, page: "index", modules:[{order: 1, name:"the_project_module", title: "THE PROJECT."}], timestamp: 1 } })

  Project.find({isActive:true, isBlocked:false}).sort({created_at:-1}).limit(1).exec(function(err, projects){
    if(err) return res.redirect("/error");
    if(projects.length === 0){
      return res.render('index/newsfeed',{ title: 'Creativity Has No Borders', error:null, data: {user: req.user, projects:projects}})
    }

    var counter_projects = 0;
    projects.forEach(function(project){

      //- Find the Picture with the smallest order number as thumbnail
        var smallestOrder;
        var counter_media = 0;
        project.media.forEach(function(item){
          if(item.type === "image" && item.isActive){
            if(counter_media === 0){
              smallestOrder = item.order;
              project.thumbnail = item.path;
              counter_media++;
            }
            if(item.order >= 0 && item.order < smallestOrder){
              smallestOrder = item.order;
              project.thumbnail = item.path;
            }
          }
        })


      //Find User Data
      User.findOne({username: project.username}, function(err, u){
        if(err) return res.redirect("/error");
        counter_projects++;
        project.profile_img = u.meta.profile_img;


        // send updates project data to client
        if(counter_projects === projects.length){
          //console.log(projects);
          res.render('index/newsfeed',{ title: 'Creativity Has No Borders', error:null, data: {user: req.user, projects:projects}})
        }
      });

    });

  });

};

//- AYAX load projects
module.exports.newsfeed_load = function(req, res) {
  if(req.user.isAuthenticated === false) res.json({success:false});

  var skip = parseInt(req.sanitize(req.body.skip));

  Project.find({isActive:true, isBlocked:false}).sort({created_at:-1}).skip(skip).limit(5).exec(function(err, projects){
    if(err || projects.length === 0) return res.json({success: false});

    var counter_projects = 0;
    projects.forEach(function(project){

      //- Find the Picture with the smallest order number as thumbnail
        var smallestOrder;
        var counter_media = 0;
        project.media.forEach(function(item){
          if(item.type === "image" && item.isActive){
            if(counter_media === 0){
              smallestOrder = item.order;
              project.thumbnail = item.path;
              counter_media++;
            }
            if(item.order >= 0 && item.order < smallestOrder){
              smallestOrder = item.order;
              project.thumbnail = item.path;
            }
          }
        })


      //Find User Data
      User.findOne({username: project.username}, function(err, u){
        if(err) return res.json({success:false});
        counter_projects++;
        project.profile_img = u.meta.profile_img;

        // send updates project data to client
        if(counter_projects === projects.length){
          res.json({success:true, user: req.user, projects:projects});
        }
      });

    });

  });

};

//- All Portfolios Page
module.exports.render_portfolios = function(req, res) {
  User.find({isActive:true, isBlocked: false}).sort({created_at:-1}).limit(20).exec(function(err, user_profiles){
    res.render('index/all_portfolios',{ title: 'All Portfolios | Creativity Has No Borders', error:null, data: {user: req.user, page: "all_portfolios", modules:[{order: 1, name:"creative_portfolio", title: "CREATIVE PORTFOLIO", profiles: user_profiles}], timestamp: 1 } })
  });
};

//- Challenges Page
module.exports.render_challenges = function(req, res) {

  Challenge.find({active_until: { $gte: new Date().toISOString() }, isActive: true}).sort({active_until:1}).exec(function(err, current_challenges){
    if(err || current_challenges.length === 0) return res.render('index/challenges',{ title: 'Challenges | Creativity Has No Borders', error:null, data: {user: req.user, page: "challenges", modules:[{order: 1, name:"creative_portfolio", title: "CHALLENGES"}], current_challenges: null, past_challenge: null} });

    Challenge.findOne({active_until: { $lte: new Date().toISOString() }, isActive: true}).sort({active_until:-1}).exec(function(err, past_challenge){
      if(err || past_challenge === null) return res.render('index/challenges',{ title: 'Challenges | Creativity Has No Borders', error:null, data: {user: req.user, page: "challenges", modules:[{order: 1, name:"creative_portfolio", title: "CHALLENGES"}], current_challenges: current_challenges, past_challenge: null} });

      //- Get the Winner information here before sending everything back to the frontend
      Project.find({challenge_name:past_challenge.name, isWinner:true, isActive:true, isBlocked:false }, function(err, winner){
        if(err || winner.length === 0) return res.render('index/challenges',{ title: 'Challenges | Creativity Has No Borders', error:null, data: {user: req.user, page: "challenges", modules:[{order: 1, name:"creative_portfolio", title: "CHALLENGES"}], current_challenges: null, past_challenge: null} });

        if(!err && winner){

          //- Find the Picture with the smallest order number as thumbnail
          for(var i = 0; i< winner.length; i++){
            var smallestOrder;
            var counter_media = 0;
            winner[i].media.forEach(function(item){
              if(item.type === "image" && item.isActive){
                if(counter_media === 0){
                  smallestOrder = item.order;
                  winner[i].thumbnail = item.path;
                  counter_media++;
                }
                if(item.order >= 0 && item.order < smallestOrder){
                  smallestOrder = item.order;
                  winner[i].thumbnail = item.path;
                }
              }
            })
            past_challenge.winner.push(winner[i]);
          }

        }
        res.render('index/challenges',{ title: 'Challenges | Creativity Has No Borders', error:null, data: {user: req.user, page: "challenges", modules:[{order: 1, name:"creative_portfolio", title: "CHALLENGES"}, {order:2, name:"current_challenges", current_challenges: current_challenges}, {order:3, name:"previous_challenge", past_challenge: past_challenge} ], current_challenges: current_challenges, past_challenge: past_challenge} })
      });

    });
  });

};

//- Certain Challenge Page
module.exports.render_challenge = function(req, res) {

  Challenge.findOne({name:req.sanitize(req.params.challengeId), isActive: true}, function(err, challenge){
    if(err || !challenge) return res.redirect("/challenges");

    Project.find({challenge_name:req.sanitize(req.params.challengeId), isActive:true, isBlocked:false }, function(err, projects){
      if(err || !projects) return res.redirect("/challenges/"+req.sanitize(req.params.challengeId));

      //- Find the Picture with the smallest order number as thumbnail
      for(var i = 0; i< projects.length; i++){
        var smallestOrder;
        var counter_media = 0;
        projects[i].media.forEach(function(item){
          if(item.type === "image" && item.isActive){
            if(counter_media === 0){
              smallestOrder = item.order;
              projects[i].thumbnail = item.path;
              counter_media++;
            }
            if(item.order >= 0 && item.order < smallestOrder){
              smallestOrder = item.order;
              projects.thumbnail = item.path;
            }
          }
        })
      }

      res.render('index/challenge',{ title: 'Challenge | Creativity Has No Borders', error:null, data: {user: req.user, page: "challenges", challenge:challenge, projects:projects } })
    });
  });
};

//- Challenge Download Brief
module.exports.render_challenges_download = function(req, res) {

  if(!req.user.isAuthenticated) return res.redirect("/challenges");

  Challenge.findOne({name: req.sanitize(req.params.challengeId), isActive:true}, function(err, challenge){
    if(err || !challenge) return res.redirect("/challenges");

    // if challenge timeframe is already over only deliver the file
    if(new Date() > new Date(challenge.active_until)){
      var filePath = "/"+challenge.brief;
      return res.redirect(filePath);
    }

    //- Checks if user is already in the list of participants
    for(var i=0; i<challenge.participants.length;i++){
      if(challenge.participants[i].username === req.user.username){
        var filePath = "/"+challenge.brief;
        return res.redirect(filePath);
      }
    };

    //Add user to the participant list
    var obj = {};
    obj.username = req.user.username;
    obj.starttime = new Date();
    obj.endtime = obj.starttime;
    if(challenge.shortMode.enabled){
      var endtime = new Date();
      endtime.setMinutes(endtime.getMinutes() + challenge.shortMode.countdown);
      obj.endtime = endtime;
    }
    obj.completed = false;


    //update DB with participant
    Challenge.update({name:challenge.name, isActive:true},{$push: {participants: obj}}, {multi:false}, function(err, c){
      if(err || !c) return res.redirect("/challenges");
      var filePath = "/"+challenge.brief;
      res.redirect(filePath);
    })

  });

}

//- About Page
module.exports.render_about = function(req, res) {
  res.render('index/about',{ title: 'About | Creativity Has No Borders', error:null, data: {user: req.user, page: "about", modules:[{order: 1, name:"creative_portfolio", title: "ABOUT US"}], timestamp: 1 } })
};

//- Partners Page
module.exports.render_partners = function(req, res) {
  res.render('index/partners',{ title: 'Partners | Creativity Has No Borders', error:null, data: {user: req.user, page: "about", modules:[{order: 1, name:"creative_portfolio", title: "PARTNERS"}], timestamp: 1 } })
};

//- Imprint Page
module.exports.render_imprint = function(req, res) {
  res.render('index/imprint',{ title: 'Imprint | Creativity Has No Borders', error:null, data: {user: req.user, page: "imprint"} })
};

//- Privacy Page
module.exports.render_privacy = function(req, res) {
  res.render('index/privacy',{ title: 'Privacy | Creativity Has No Borders', error:null, data: {user: req.user, page: "privacy"}})
};


//- Redirects

//- To Login-Page
module.exports.redirect_login = function(req, res) {
  res.redirect("auth/login");
};

//- To SignUp Page
module.exports.redirect_register = function(req, res) {
  res.redirect("auth/register");
};

//- Logout
module.exports.redirect_logout = function(req, res) {
  res.redirect("auth/logout");
};
