(function() {
    var appModule = angular.module("InstaPicGram", [])
        .controller("PageController", function($scope, $http) {
            // Indicates the maximum number of displayed pictures at the same time.
            const MAX_IMAGES = 3;

            // Initializes pictures array.
            $scope.pictures = [];

            // "Show me some pics!" button is disabled by default.
            $scope.showPicsButtonDisabled = true;
            $scope.isMouseOverPicture = false;
            $scope.isMouseOverNote = false;
            $scope.isPictureRejected = false;
            $scope.isPictureLiked = false;

            // Occurs when the page successfully loaded.
            angular.element(document).ready(function () {
                // Randomly rotates each picture but the first.
                for (var i = 2; i <= MAX_IMAGES; ++i) {
                    $("#picture" + i).css("transform", "translateX(calc(-50% - 50px)) rotate(" + ((Math.random() * 2 + 2) * Math.pow(-1, i)) + "deg)");
                }

                // Loads components tooltips.
                $('[data-toggle="tooltip"]').tooltip();
                // Focus hashtags input fields.
                $("#hashtagsInput").focus();
            });

            // Executes a left or right swipe of the current picture when the
            // user pressed the left or right arrow keys.
            angular.element(document).bind("keypress", function(event) {
                // The hashtags fields must not be focus otherwise nothing happens.
                if (!$("#hashtagsInput").is(":focus")) {
                    // The user pressed the left arrow key.
                    if (event.keyCode === 37) {
                        $("#reject-button").click();
                    }
                    // The user pressed the right arrow key.
                    else if (event.keyCode === 39) {
                        $("#like-button").click();
                    }
                }
                // Simulate a click on the "Show me some pics!" button if the
                // hashtags fields is selected and the user pressed the 'Enter'
                // key.
                else {
                    if (event.keyCode === 13) {
                        $("#btnShowPics").click();
                    }
                }
            });

            function resetFields() {
                $scope.resultInformation = null;
                $("#pictures").hide();
                $("#hashtagsInput").focus();
            }

            // Enables or disables the "Show me some pics!" button, depending on
            // whether the user entered hashtags or not.
            $scope.validateHashtags = function() {
                if ($scope.hashtags) {
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
                $scope.errorHashtags = null;

                // Only make the request if the user's token is set and if the
                // user entered at least one hashtag.
                if ($scope.accessToken && $scope.hashtags) {
                    $http.jsonp("https://api.instagram.com/v1/tags/" + $scope.hashtags + "?access_token=" + $scope.accessToken + "&callback=JSON_CALLBACK").then(
                        function success(response) {
                            if (response.data.meta.code === 200) {
                                $scope.resultInformation = "There is " + response.data.data.media_count + " existing media for #" + response.data.data.name + ".";

                                if (response.data.data.media_count > 0) {
                                    $http.jsonp("https://api.instagram.com/v1/tags/" + $scope.hashtags + "/media/recent?access_token=" + $scope.accessToken + "&callback=JSON_CALLBACK").then(
                                        function success(response) {
                                            console.log(response);

                                            if (response.data.data.length > 0) {
                                                var i = 0;

                                                while (response.data.data[i].type != "image") {
                                                    ++i;
                                                }

                                                var pictureData = {
                                                    url: response.data.data[i].images.standard_resolution.url,
                                                    description: response.data.data[i].caption.text,
                                                    username: response.data.data[i].caption.from.username
                                                }

                                                $scope.pictures.push(pictureData);

                                                $("#pictures").fadeIn("fast");
                                                $("#hashtagsInput").blur();
                                            }
                                        },
                                        function error(response) {
                                            $scope.errorHashtags = "Oops... Something wrong happened when getting pictures, please retry in a while.";
                                            resetFields();
                                        }
                                    );
                                }
                            }
                            else {
                                $scope.errorHashtags = response.data.meta.error_message;
                            }
                        },
                        function error(response) {
                            $scope.errorHashtags = "Oops... Something wrong happened when getting hashtags stats, please retry in a while.";
                            resetFields();
                        }
                    );
                }
                else if (!$scope.hashtags) {
                    $scope.errorHashtags = "Please enter at least one hashtag.";
                    resetFields();
                }
            };
        });
})();
