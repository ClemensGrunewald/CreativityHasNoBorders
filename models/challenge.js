var config    = require('../config');

//- Mongoose Database Integration
var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/'+config.mongodb, {useMongoClient: true});


//- Create a Challenge Schema
var challengeSchema = new Schema({
  name: {type: String, required: true, unique: true},
  title: {type: String, required: true},
  description: {type: String, default: "no description available"},
  brief: {type: String, default:''},
  author: {type: String, required: true},
  shortMode: {
      enabled: {type: Boolean, default: false},
      countdown: {type: Number, default: 0}
  },
  participants: Array,
  created_at: {type: Date, default: new Date()},
  updated_at: Date,
  active_until: Date, //{type: Date, default: new Date(Date.now()+4*7*24*60*60*1000)}
  isActive: {type: Boolean, default: true},
  winner: Array
});

//- Update the updated_at parameter
challengeSchema.pre('save', function(next){
  var challenge = this;
  challenge.updated_at = new Date();

  var err = new Error('something went wrong');
  next();
});


//- Create User Model
var Challenge = mongoose.model('Challenge', challengeSchema);

//- Export
module.exports = Challenge;
