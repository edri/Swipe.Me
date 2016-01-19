var express = require('express');
var router = express.Router();
var applicationName = "Swipe.Me";

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: applicationName });
});

/* GET policy page. */
router.get('/policy', function(req, res) {
  res.render('policy', { title: 'Policy', applicationName: applicationName });
});

module.exports = router;
