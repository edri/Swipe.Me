(function() {
    var appModule = angular.module("Swipe.Me", [])
        .controller("SwiperController", function($scope, $http, $compile) {
            // Indicates the maximum number of displayed pictures at the same time.
            const MAX_IMAGES = 3;
            // Indicates the current displayed picture's index.
            $scope.currentPictureIndex = 0;
            $scope.firstDisplayedPictureIndex = 0;

            // "Show me some pics!" button is disabled by default.
            $scope.showPicsButtonDisabled = true;

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
            angular.element(document).bind("keypress", function(event) {
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
                $("#hashtagInput").focus();
            }

            // Enables or disables the "Show me some pics!" button, depending on
            // whether the user entered a hashtag or not.
            $scope.validateHashtag = function() {
                if ($scope.hashtag) {
                    $scope.showPicsButtonDisabled = false;
                }
                else {
                    $scope.showPicsButtonDisabled = true;
                }
            }

            // Show pics related to given tags.
            $scope.showPics = function() {
                $scope.showPicsButtonDisabled = true;
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
                    $http.jsonp("https://api.instagram.com/v1/tags/" + $scope.hashtag + "?access_token=" + $scope.accessToken + "&callback=JSON_CALLBACK").then(
                        function success(response) {
                            // Checks if the response is positive.
                            if (response.data.meta.code === 200) {
                                // Sets stats values.
                                $scope.numberOfMedia = response.data.data.media_count;
                                $scope.hashtagName = response.data.data.name;

                                // Gets 10 pictures if there is more than 0 results.
                                if (response.data.data.media_count > 0) {
                                    $http.jsonp("https://api.instagram.com/v1/tags/" + $scope.hashtag + "/media/recent?count=10&access_token=" + $scope.accessToken + "&callback=JSON_CALLBACK").then(
                                        function success(response) {
                                            $scope.numberOfPictures = response.data.data.length;

                                            // Checks if there is more than 0 public picture.
                                            if (response.data.data.length > 0) {
                                                // (Re)initializes pictures array.
                                                $scope.pictures = [];

                                                // Add each picture's data in scope.
                                                angular.forEach(response.data.data, function(data) {
                                                    if (data.type === "image") {
                                                        // Only put useful data in array.
                                                        $scope.pictures.push({
                                                            id: data.id,
                                                            url: data.images.standard_resolution.url,
                                                            //url: data.images.thumbnail.url,
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

                                                setTimeout(function() {
                                                    // Randomly rotates each picture but the first.
                                                    for (var i = 0; i < $scope.pictures.length - 1; ++i) {
                                                        $("#picture" + i).css("transform", "translateX(calc(-50%)) rotate(" + ((Math.random() * 2 + 2) * Math.pow(-1, i)) + "deg)");
                                                    }
                                                }, 1000);

                                                $("#logo").fadeOut("fast", function() {
                                                    $("#pictures").fadeIn("fast");
                                                });

                                                $("#hashtagInput").blur();
                                            }
                                            else {
                                                resetFields(false);
                                            }
                                        },
                                        function error(response) {
                                            $scope.errorhashtag = "Oops... Something wrong happened when getting pictures, please retry in a while.";
                                            resetFields(true);
                                        }
                                    );
                                }
                                else {
                                    resetFields(false);
                                }
                            }
                            else {
                                $scope.errorhashtag = response.data.meta.error_message;
                                resetFields(true);
                            }
                        },
                        function error(response) {
                            $scope.errorhashtag = "Oops... Something wrong happened when getting hashtag's stats, please retry in a while.";
                            resetFields(true);
                        }
                    );
                }
                else if (!$scope.hashtag) {
                    $scope.errorhashtag = "Please enter one hashtag.";
                    resetFields(true);
                }
            };

            // Rejects or likes the current picture, by the user's choice.
            // Parameters:
            //      - reject: indicate whether the picture is rejected (true) or
            //                not (false) by the user.
            $scope.changePictureStatus = function(reject) {
                if ($scope.currentPictureIndex < $scope.numberOfPictures) {
                    if (reject) {
                        $scope.pictures[$scope.currentPictureIndex++].isPictureRejected = true;
                    }
                    else {
                        $scope.pictures[$scope.currentPictureIndex++].isPictureLiked = true;
                    }

                    // Remove the picture after a while.
                    setTimeout(function() {
                        $("#picture" + ($scope.firstDisplayedPictureIndex++)).remove();
                        $("#picture" + $scope.firstDisplayedPictureIndex + 2).css("transform", "translateX(calc(-50%)) rotate(" + ((Math.random() * 2 + 2) * Math.pow(-1, i)) + "deg)");

                        //$compile($("#picture" + $scope.firstDisplayedPictureIndex));

                        $scope.$apply();
                    }, 850);
                }
            }
        });
})();
