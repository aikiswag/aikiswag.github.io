function makeDraggable(element) {
    let offsetX = 0, offsetY = 0;

    element.addEventListener('mousedown', bringToFront);

    function bringToFront() {
        const windows = document.querySelectorAll('.window');
        let maxZIndex = 0;

        windows.forEach((window) => {
            const zIndex = parseInt(window.style.zIndex || 0, 10);
            if (zIndex > maxZIndex) {
                maxZIndex = zIndex;
            }
        });

        element.style.zIndex = maxZIndex + 1;

        const rect = element.getBoundingClientRect();
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }

    function drag(event) {
        const x = event.clientX - offsetX;
        const y = event.clientY - offsetY;

        element.style.left = x + 'px';
        element.style.top = y + 'px';
    }

    function stopDrag() {

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }
}

const allWindowsContainer = document.getElementById('all-windows');
const windowElements = allWindowsContainer.querySelectorAll('.window');
windowElements.forEach(makeDraggable);

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