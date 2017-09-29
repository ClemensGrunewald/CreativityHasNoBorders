var express = require('express');
var router = express.Router();

var controller = require('../controllers/index');

//- Render Routes
router.get('/', controller.render_index);

router.get('/portfolios', controller.render_portfolios)

/*router.get('/challenges', controller.render_challanges)

router.get('/about', controller.render_about)

router.get('/partners', controller.render_register)

router.get('/imprint', controller.render_imprint)

router.get('/privacy', controller.render_privacy)

*/


//- Export routes
module.exports = router;
