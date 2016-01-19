var express = require('express');
var router = express.Router();
var request = require('request');
var session = require('express-session');
var request = require('request');
var session = require('express-session');

const CLIENT_ID = "ba3659e9c0974ab39393e07eb031e05d";
const CLIENT_SECRET = "d2e338bbc4b8440abd2dc6a952166c0a";
// CHANGE FOR PRODUCTION.
const APPLICATION_URL = "https://swipe-me.herokuapp.com";
//const APPLICATION_URL = "http://localhost:3028";
const APPLICATION_NAME = "Swipe.Me";

/* GET home page. */
router.get('/', function(req, res) {
    // Get error if there is one.
    var error = req.query.error;

    // Send username or 'undefined' to the view, depending on the user's connection
    // status. Also send an error if there is one.
    res.render('index', {
        title: APPLICATION_NAME,
        applicationUrl: APPLICATION_URL,
        clientId: CLIENT_ID,
        username: req.session.username,
        accessToken: req.session.accessToken,
        error: error
    });
});

// This request is where the Instagram API will send the code generated for the
// user who accepted to share its data with the application.
router.get('/auth', function(req, res) {
    // Get Instagram API's generated code if exists.
    var code = req.query.code;
    // Get error if there is one.
    var error = req.query.error;

    // Redirects back the user with an error, if something wrong happened.
    if (error) {
        res.redirect('/?error=true');
    }
    // If we successfully received a code, requests the access token to the API.
    else if (code) {
        var data = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "authorization_code",
            redirect_uri: APPLICATION_URL + "/auth",
            code: code
        };

        request.post({url: 'https://api.instagram.com/oauth/access_token', form: data}, function(error, result, body) {
            if (error) {
                res.redirect('/?error=true');
            }

            // Try to parse result to get access token and username.
            try {
                var jsonResult = JSON.parse(body);
                // Save access token and username in the current session.
                req.session.accessToken = jsonResult.access_token;
                req.session.username = jsonResult.user.username;
                res.redirect('/');
            }
            catch (e) {
                console.log(e);
                res.redirect('/?error=true');
            }
        });
    }
    // The request must have parameters otherwise we redirect back the user.
    else {
        res.redirect('/');
    }
})

// Logout the connected user.
router.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

/* GET policy page. */
router.get('/policy', function(req, res) {
    res.render('policy', {
        title: 'Policy',
        applicationName: APPLICATION_NAME,
        username: req.session.username
    });
});

module.exports = {router, session};
