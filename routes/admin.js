var express = require('express');
var router = express.Router();


//- Routes
router.get('/', function(req, res){
  res.json({ admin: 'panel' });
})


//- Export routes
module.exports = router;
