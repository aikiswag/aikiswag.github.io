 document.addEventListener('DOMContentLoaded', function() {

        let fullscreenTriggered = false;

        function requestFullscreen() {
            const element = document.documentElement;

            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) { 
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) { 
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) { 
                element.msRequestFullscreen();
            }
        }


        function handleClick() {
            if (!fullscreenTriggered) {
                requestFullscreen();
                fullscreenTriggered = true;
            }
        }


        document.addEventListener('click', handleClick);
    }); 