var express = require('express');
var router = express.Router();
var request = require('request');
var session = require('express-session');
var request = require('request');
var session = require('express-session');

const CLIENT_ID = "ba3659e9c0974ab39393e07eb031e05d";
const CLIENT_SECRET = "d2e338bbc4b8440abd2dc6a952166c0a";
// CHANGE FOR PRODUCTION.
//const APPLICATION_URL = "https://swipe-me.herokuapp.com";
const APPLICATION_URL = "http://localhost:3028";
const APPLICATION_NAME = "Swipe.Me";

/* GET home page. */
router.get('/', function(req, res) {
    // Redirect the user if it is already connected.
    if (req.session.username) {
        res.redirect('/swiper');
    }
    else {
        // Send username or 'undefined' to the view, depending on the user's connection
        // status. Also send an error if there is one.
        res.render('index', {
            title: APPLICATION_NAME,
            applicationUrl: APPLICATION_URL,
            clientId: CLIENT_ID,
            error: req.query.error
        });
    }
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
                res.redirect('/swiper');
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
});

/* GET swiper page. */
router.get('/swiper', function(req, res) {
    // The user must be connected to access the action.
    if (req.session.username) {
        res.render('swiper', {
            title: APPLICATION_NAME,
            applicationUrl: APPLICATION_URL,
            username: req.session.username,
            accessToken: req.session.accessToken
        });
    }
    else {
        res.redirect('/');
    }
});

// Sends a like for the given picture to the Instagram API.
router.get('/like/:picture_id', function(req, res) {
    // The session must be active.
    if (req.session.accessToken) {
        request.post({url: 'https://api.instagram.com/v1/media/' + req.params.picture_id + '/likes?access_token=' + req.session.accessToken}, function(error, result, body) {
            if (error) {
                res.send({
                    error: true,
                    errorType: "requestError"
                })
            }
            else {
                var resultData = JSON.parse(body);

                // Send data to the called (public/app.js), depending on the result's
                // code.
                // First case: no error, everything went right.
                if (resultData.meta.code === 200) {
                    res.send({
                        error: false
                    });
                }
                // Second case: the user made too much requests to the Instagram
                // REST API server so he has to wait for a while.
                else if (resultData.meta.code === 429) {
                    res.send({
                        error: true,
                        errorType: "rateLimit"
                    });
                }
                // Third case: unknown result's code.
                else {
                    res.send({
                        error: true,
                        errorType: "unknowCode"
                    })
                }
            }
        });
    }
    // Send an error if the session expired.
    else {
        res.send({
            error: true,
            errorType: "sessionExpired"
        });
    }
});

// Logout the connected user.
router.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

/* GET policy page. */
router.get('/policy', function(req, res) {
    res.render('policy', {
        title: APPLICATION_NAME + ' - Policy',
        applicationName: APPLICATION_NAME,
        username: req.session.username
    });
});

module.exports = {router, session};
