(function() {
    var appModule = angular.module("Swipe.Me", [])
        .controller("SwiperController", function($scope, $http, $window) {
            // Indicates if a (dis)like request is underway so the user cannot
            // (dis)like another picture during the request.
            // Used for concurrency issues.
            var actionUnderway = false;

            // Indicates the maximum number of displayed pictures at the same time.
            $scope.numberMaxPictures = 5;

            // Indicates the current displayed picture's index.
            $scope.currentPictureIndex = 0;
            $scope.firstDisplayedPictureIndex = 0;
            $scope.hashtag = "";

            // "Show me some pics!" button is disabled by default.
            $scope.showPicsButtonDisabled = true;
            $scope.showPicsButtonLabel = "Show me some pics!";

            // Occurs when the page successfully loaded.
            angular.element(document).ready(function () {
                $("#logo").fadeIn("slow");
                // Loads components tooltips.
                $("[data-toggle='tooltip']").tooltip();
                // Focus hashtag input fields.
                $("#hashtagInput").focus();
            });

            // Executes a left or right swipe of the current picture when the
            // user pressed the left or right arrow keys.
            angular.element(document).bind("keydown", function(event) {
                // The hashtag field must not be focus otherwise nothing happens.
                if (!$("#hashtagInput").is(":focus")) {
                    // The user pressed the left arrow key ; rejects the picture.
                    if (event.keyCode === 37) {
                        // Prevent default reaction (right scrolling) of the right
                        // arrow key.
                        event.preventDefault();
                        $("#reject-button" + $scope.currentPictureIndex).click();
                    }
                    // The user pressed the right arrow key ; likes the picture.
                    else if (event.keyCode === 39) {
                        // Prevent default reaction (left scrolling) of the right
                        // arrow key.
                        event.preventDefault();
                        $("#like-button" + $scope.currentPictureIndex).click();
                    }
                }
                // Simulate a click on the "Show me some pics!" button if the
                // hashtag fields is selected and the user pressed the 'Enter'
                // key.
                else {
                    if (event.keyCode === 13) {
                        $("#btnShowPics").click();
                    }
                }
            });

            // Resets fields and scope data related to pictures.
            // Parameters:
            //      - resetScopeData: indicates if the scope data must be reset
            //                        (true) or not (false);
            function resetFields(resetScopeData) {
                if (resetScopeData) {
                    $scope.numberOfMedia = null;
                    $scope.numberOfPictures = null;
                }

                $("#pictures").hide();
                $("#logo").fadeIn("fast");
                $("#hashtagInput").focus();
            }

            // Reset the "Show me some pics!" button after the tag's search.
            function resetButton() {
                $scope.showPicsButtonDisabled = false;
                $scope.showPicsButtonLabel = "Show me some pics!";
            }

            // Occured when a picture has been swiped (rejected or liker).
            // Deletes the element (memory optimization) and operate some design
            // effects on the new-appeared picture.
            function cleanPictureSwitch() {
                actionUnderway = false;

                // Displays an information message under the current picture if it
                // is the penultimate one.
                if ($scope.currentPictureIndex === $scope.numberOfPictures) {
                    // Copies the current hashtag in a temporary scope variable
                    // so we will be able to display the old tag in the "no more
                    // picture" message and we can reset the real hashtag's value.
                    $scope.hashtagCopy = $scope.hashtag;
                    $scope.hashtag = "";
                }

                // Removes the picture after a while.
                setTimeout(function() {
                    $("#picture" + ($scope.firstDisplayedPictureIndex++)).remove();

                    // Resets values if this was the last value.
                    if ($scope.currentPictureIndex === $scope.numberOfPictures) {
                        $scope.numberOfMedia = null;
                        $scope.numberOfPictures = null;
                        $scope.showPicsButtonDisabled = true;
                        $("#hashtagInput").focus();
                    }

                    // Applys scope's changes because of the setTimeout function
                    // (updates can't be automatically get by Angular in this case).
                    $scope.$apply();
                }, 850);
                // Then show the new picture in the pictures stack.
                setTimeout(function() {
                    $("#picture" + ($scope.firstDisplayedPictureIndex + $scope.numberMaxPictures - 1)).fadeIn("fast");
                    $("#picture" + ($scope.firstDisplayedPictureIndex + $scope.numberMaxPictures - 1)).css("transform", "translateX(calc(-50%)) rotate(" + ((Math.random() * 4) * Math.pow(-1, $scope.firstDisplayedPictureIndex + $scope.numberMaxPictures - 1)) + "deg)");
                    $("#reject-button" + ($scope.firstDisplayedPictureIndex + $scope.numberMaxPictures - 1)).tooltip();
                    $("#like-button" + ($scope.firstDisplayedPictureIndex + $scope.numberMaxPictures - 1)).tooltip();
                }, 1000);
            }

            // Deal the given error, comming from the reject() or like() scope's
            // method.
            function dealActionErrors(errorType) {
                actionUnderway = false;

                switch (errorType) {
                    case "rateLimit":
                        alert("You liked too many pictures in a short time (> 60 / hour), please retry in one hour.");
                        break;
                    // Redirects the user if the session expired.
                    case "sessionExpired":
                        alert("Your connection session expired, please reconnect.");
                        $window.location.href = "/";
                        break;
                    case "requestError":
                    case "unknowCode":
                    case "unknowAction":
                    default:
                        alert("Something wrong happened, please retry in a while.");
                        break;
                }
            }

            // Enables or disables the "Show me some pics!" button, depending on
            // whether the user entered a hashtag or not.
            $scope.validateHashtag = function(event) {
                // The event is irrevelant for the 'Enter' key so we ignore it.
                if (event.keyCode != 13) {
                    if ($scope.hashtag) {
                        resetButton();
                    }
                    else {
                        $scope.showPicsButtonDisabled = true;
                    }
                }

                // Hides the "No more pictures" message if the user pressed a key
                // different to the right or left arrows keys.
                if (event.keyCode != 37 && event.keyCode != 39) {
                      $scope.hashtagCopy = null;
                      $("#pictures").hide();
                      $("#logo").fadeIn("fast");
                }
            }

            // Show pics related to given tags.
            $scope.showPics = function() {
                $scope.showPicsButtonDisabled = true;
                $scope.showPicsButtonLabel = "Searching...";
                // Reset errors.
                $scope.errorhashtag = null;
                $scope.hashtagName = $scope.hashtag;

                // Removes the '#' at the begining of the hashtag if the user wrote it.
                if ($scope.hashtag.charAt(0) === '#') {
                    $scope.hashtag = $scope.hashtag.substr(1);
                }

                // Only make the request if the user's token is set and if the
                // user entered at least one hashtag.
                if ($scope.accessToken && $scope.hashtag) {
                    // The session must still be active.
                    $http.get($scope.applicationUrl + "/isSessionActive").then(
                        function success(response) {
                            // If the session is still active we can do a request
                            // to the Instafram API to get pictures related to
                            // the given tag.
                            if (response.data) {
                                $http.jsonp("https://api.instagram.com/v1/tags/" + $scope.hashtag + "?access_token=" + $scope.accessToken + "&callback=JSON_CALLBACK").then(
                                    function success(response) {
                                        // Checks if the response is positive.
                                        if (response.data.meta.code === 200) {
                                            // Sets stats values.
                                            $scope.numberOfMedia = response.data.data.media_count;
                                            $scope.hashtagName = response.data.data.name;

                                            // Gets 100 pictures if there is more than 0 results.
                                            // Don't worry we're just getting images URL so it won't
                                            // slow down the system.
                                            if (response.data.data.media_count > 0) {
                                                $http.jsonp("https://api.instagram.com/v1/tags/" + $scope.hashtag + "/media/recent?count=100&access_token=" + $scope.accessToken + "&callback=JSON_CALLBACK").then(
                                                    function success(response) {
                                                        $scope.numberOfPictures = response.data.data.length;

                                                        // Checks if there is more than 0 public picture.
                                                        if (response.data.data.length > 0) {
                                                            // (Re)initializes pictures array and scope data.
                                                            $scope.pictures = [];
                                                            $scope.currentPictureIndex = 0;
                                                            $scope.firstDisplayedPictureIndex = 0;
                                                            $("#pictures").show();

                                                            // Add each picture's data in scope.
                                                            angular.forEach(response.data.data, function(data) {
                                                                if (data.type === "image") {
                                                                    // Only put useful data in array.
                                                                    $scope.pictures.push({
                                                                        id: data.id,
                                                                        pictureUrl: data.images.standard_resolution.url,
                                                                        url: data.link,
                                                                        description: data.caption.text,
                                                                        username: data.caption.from.username,
                                                                        alreadyLiked: data.user_has_liked,
                                                                        isMouseOverPicture: false,
                                                                        isMouseOverNote: false,
                                                                        isPictureRejected: false,
                                                                        isPictureLiked: false
                                                                    });
                                                                }
                                                            });

                                                            // Fades the first pictures in and rotate them after a while.
                                                            setTimeout(function() {
                                                                // Randomly rotates each picture but the first.
                                                                for (var i = 0; i < $scope.numberMaxPictures; ++i) {
                                                                    $("#picture" + i).fadeIn("fast");
                                                                    $("#reject-button" + i).tooltip();
                                                                    $("#like-button" + i).tooltip();

                                                                    if (i > 0) {
                                                                        $("#picture" + i).css("transform", "translateX(calc(-50%)) rotate(" + ((Math.random() * 2 + 2) * Math.pow(-1, i)) + "deg)");
                                                                    }
                                                                }
                                                            }, 400);

                                                            $("#logo").fadeOut("fast");
                                                            $("#hashtagInput").blur();
                                                        }
                                                        else {
                                                            resetFields(false);
                                                        }

                                                        resetButton();
                                                    },
                                                    function error(response) {
                                                        $scope.errorhashtag = "Oops... Something wrong happened when getting pictures, please retry in a while.";
                                                        resetFields(true);
                                                        resetButton();
                                                    }
                                                );
                                            }
                                            else {
                                                resetFields(false);
                                                resetButton();
                                            }
                                        }
                                        // The user did too many requests in a short time.
                                        else if (response.data.meta.code === 429) {
                                            $scope.errorhashtag = "You did too many requests in a short time... Please retry in one hour.";
                                            resetFields(true);
                                            resetButton();
                                        }
                                        else {
                                            $scope.errorhashtag = response.data.meta.error_message;
                                            resetFields(true);
                                            resetButton();
                                        }
                                    },
                                    function error(response) {
                                        $scope.errorhashtag = "Oops... Something wrong happened when getting hashtag's stats, please retry in a while.";
                                        resetFields(true);
                                        resetButton();
                                    }
                                );
                            }
                            // If there is no more session the user is redirected.
                            else {
                                alert("Your connection session expired, please reconnect.");
                                $window.location.href = "/";
                            }
                        },
                        function error(response) {
                            $scope.errorhashtag = "Oops... Something wrong happened, please retry in a while.";
                            resetFields(true);
                            resetButton();
                        }
                    );
                }
                else if (!$scope.hashtag) {
                    $scope.errorhashtag = "Please enter one hashtag.";
                    resetFields(true);
                    resetButton();
                }
            };

            // Rejects the current picture.
            $scope.reject = function() {
                if (!actionUnderway && $scope.currentPictureIndex < $scope.numberOfPictures) {
                    actionUnderway = true;

                    // Dislikes the picture if it is already liked by the user.
                    if ($scope.pictures[$scope.currentPictureIndex].alreadyLiked && $scope.applicationUrl) {
                        // First make the user believe he disliked the picture,
                        // before sending the request.
                        // I made this because of the request's time, which
                        // can be of 1-2 seconds and the user will be bored
                        // to always wait for a while.
                        // If an error happens the picture will be reinitialized.
                        $scope.pictures[$scope.currentPictureIndex].isPictureRejected = true;

                        // Send a request to the local server so he can make the POST
                        // like-request without any cross-origin issue.
                        $http.get($scope.applicationUrl + "/action/dislike/" + $scope.pictures[$scope.currentPictureIndex].id).then(
                            function success(response) {
                                // Checks if an error occured.
                                if (response.data.error) {
                                    // Resets the "fake" dislike on the image, because
                                    // the picture was not really disliked.
                                    $scope.pictures[$scope.currentPictureIndex].isPictureRejected = false;
                                    dealActionErrors(response.data.errorType);
                                }
                                // If there is no error we can like the picture
                                // in the GUI.
                                else {
                                    ++$scope.currentPictureIndex;
                                    cleanPictureSwitch();
                                }
                            },
                            function error(response) {
                                $scope.pictures[$scope.currentPictureIndex].isPictureRejected = false;
                                alert("Something wrong happened, please retry in a while.");
                            }
                        );
                    }
                    else
                    {
                        $scope.pictures[$scope.currentPictureIndex++].isPictureRejected = true;
                        cleanPictureSwitch();
                    }
                }
            }

            // Likes the current picture.
            $scope.like = function() {
                if (!actionUnderway && $scope.currentPictureIndex < $scope.numberOfPictures) {
                    actionUnderway = true;

                    // Likes the picture if it is not already liked by the user.
                    if (!$scope.pictures[$scope.currentPictureIndex].alreadyLiked && $scope.applicationUrl) {
                        // First make the user believe he liked the picture,
                        // before sending the request.
                        // I made this because of the request's time, which
                        // can be of 1-2 seconds and the user will be bored
                        // to always wait for a while.
                        // If an error happens the picture will be reinitialized.
                        $scope.pictures[$scope.currentPictureIndex].isPictureLiked = true;

                        // Send a request to the local server so he can make the POST
                        // like-request without any cross-origin issue.
                        $http.get($scope.applicationUrl + "/action/like/" + $scope.pictures[$scope.currentPictureIndex].id).then(
                            function success(response) {
                                // Checks if an error occured.
                                if (response.data.error) {
                                    // Reset the "fake" like on the image, because
                                    // the picture was not really liked.
                                    $scope.pictures[$scope.currentPictureIndex].isPictureLiked = false;
                                    dealActionErrors(response.data.errorType);
                                }
                                // If there is no error we can like the picture
                                // in the GUI.
                                else {
                                    ++$scope.currentPictureIndex;
                                    cleanPictureSwitch();
                                }
                            },
                            function error(response) {
                                $scope.pictures[$scope.currentPictureIndex].isPictureLiked = false;
                                alert("Something wrong happened, please retry in a while.");
                            }
                        );
                    }
                    // If the picture is already liked we don't have to like it again.
                    else {
                        $scope.pictures[$scope.currentPictureIndex++].isPictureLiked = true;
                        cleanPictureSwitch();
                    }
                }
            }
        });
})();
