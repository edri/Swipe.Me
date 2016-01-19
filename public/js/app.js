(function() {
    var appModule = angular.module("InstaPicGram", [])
        .controller("PageController", function($scope) {
            // Indicates the maximum number of displayed pictures at the same time.
            const MAX_IMAGES = 3;

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
            });
        });
})();
