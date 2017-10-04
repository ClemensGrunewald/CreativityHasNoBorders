var config    = require('../config');

//- Mongoose Database Integration
var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
mongoose.connect('mongodb://localhost/'+config.mongodb);


//- Create a Challenge Schema
var challengeSchema = new Schema({
  name: {type: String, required: true, unique: true},
  title: {type: String, required: true},
  description: {type: String, default: "no description available"},
  author: {type: String, required: true},
  meta: {
    cover_img: String,
    images: Array,
    videos: Array,
    documents: Array
  },
  created_at: {type: Date, default: new Date()},
  updated_at: Date,
  active_until: {type: Date, default: new Date(Date.now()+4*7*24*60*60*1000)},
});

//- Password Hashing before saving
challengeSchema.pre('save', function(next){
  var challenge = this;
  challenge.updated_at = new Date();
});


//- Create User Model
var Challenge = mongoose.model('Challenge', challengeSchema);

//- Export
module.exports = Challenge;
