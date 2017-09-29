var express = require('express');
var router = express.Router();


//- Routes
router.get('/:username', function(req, res){
  res.json({ hello: req.params.username });
})


//- Export routes
module.exports = router;
