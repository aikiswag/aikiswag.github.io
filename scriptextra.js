// Glitch Line Vars
var glitch_lines = 15,
	glitch_line_duration_min = 100,
	glitch_line_duration_max = 500,
	glitch_line_timer_min = 100,
	glitch_line_timer_max = 5000,
	glitch_line_wait_min = 100,
	glitch_line_wait_max = 3000,
	glitch_line_height_min = 5,
	glitch_line_height_max = 50;

// Glitch Move Vars
var glitch_move_color_1 = '#08FFF2',
	glitch_move_color_2 = '#FC0DFF',
	glitch_move_original_color = '#585E62',
	glitch_move_opacity = .2,
	glitch_move_duration_min = 1000,
	glitch_move_duration_max = 300,
	glitch_move_timer_min = 500,
	glitch_move_timer_max = 1500,
	glitch_move_wait_min = 1000,
	glitch_move_wait_max = 2000,
	glitch_move_amount_min = -10,
	glitch_move_amount_max = 10;

// Do you want to autostart on page load?
var glitch_autostart = 1;

// Start Glitch on page load.
window.onload = function() {
	if (glitch_autostart) {
		glitch = new glitch();
		glitch.init();
	}
}

// Random integer function (Will correctly work w/ negative numbers)
function randomInt(min, max){
    return Math.floor(Math.random()*(max-min+1)+min);
}

// Glitch functionality
function glitch() {

	// Initialize the glitches
	// - Create divs
	// - Load divs from <glitch> element
	// - Set body to not scroll on x-axis
	// - Starts glitch animations

	this.init = function() {
		page_content = $('glitch').html();
		$('body').css('overflow-x', 'hidden');

		// Glitch Lines
		linecount = 0;
		this.glitchlines = [];
		while (linecount < glitch_lines) {
			$('body').append('<div class="glitch-line-'+linecount+'">'+page_content+'</div>');
			$('.glitch-line-'+linecount).css({
				'height': '100%',
				'width': '100%',
				'position': 'absolute',
				'top': '0',
				'left': '0'
			}).hide();
			this.glitchline('.glitch-line-'+linecount, linecount);
			linecount++;
		}

		// Glitch Move
		$('body').append('<div class="glitch-div-1">'+page_content+'</div>');
		$('body').append('<div class="glitch-div-2">'+page_content+'</div>');
		$('.glitch-div-1, .glitch-div-2').css({
			'height': '100%',
			'width': '100%',
			'position': 'absolute',
			'top': '0',
			'left': '0'
		});
		this.glitchmove();
	}

	this.glitchline = function(div, id) {
		// Store an array of glitchlines
		this.glitchlines[id] = new glitchline;
		this.glitchlines[id].start(div);
	}

	this.glitchmove = function() {
		glitchmove = new glitchmove;
		glitchmove.start();
	}

}

// Glitch Move Animation

function glitchmove() {

	// Start glitch
	this.start = function() {
		selfmove = this;

		// Create a move on a regular duration
		setInterval(function() {
			// Wait a random number of ms to execute
			setTimeout(function() {
				// Create animation
				selfmove.move();
			}, randomInt(glitch_move_wait_min, glitch_move_wait_max));
		}, randomInt(glitch_move_timer_min, glitch_move_timer_max));

	}

	this.move = function() {
		// Move the divs a random number of pixels top & left, change the color & opacity.
		$('.glitch-div-1').css({
			'left': randomInt(glitch_move_amount_min, glitch_move_amount_max) + 'px',
			'top': randomInt(glitch_move_amount_min, glitch_move_amount_max) + 'px',
			'opacity': glitch_move_opacity,
			'color': glitch_move_color_1
		});
		$('.glitch-div-2').css({
			'left': randomInt(glitch_move_amount_min, glitch_move_amount_max) + 'px',
			'top': randomInt(glitch_move_amount_min, glitch_move_amount_max) + 'px',
			'opacity': glitch_move_opacity,
			'color': glitch_move_color_2
		});

		// Prepare to move divs back
		this.moveback();
	}

	this.moveback = function() {
		// Move the divs back after a random time duration
		this.timeout = setTimeout(function() {
			// Make sure we set the text back to the original color!
			$('.glitch-div-1, .glitch-div-2').css({
				'left': '0px',
				'top': '0px',
				'color': glitch_move_original_color,
				'opacity': '1',
			});
		}, randomInt(glitch_move_duration_min, glitch_move_duration_max));
	}
}

function glitchline() {

	this.start = function(div) {
		selfline = this;
		// Hold our timeouts.
		this.timeouts = [];

		// Create a move on a regular duration
		setInterval(function() {
			// Wait a random number of ms to execute
			setTimeout(function() {
				selfline.add(div);
			}, randomInt(glitch_line_wait_min, glitch_line_wait_max));
		}, randomInt(glitch_line_timer_min, glitch_line_timer_max));
	}

	this.add = function(div) {
		// change the height, width, top, and left using a random number
		$(div).css({
			'height': randomInt(glitch_line_height_min, glitch_line_height_max) + 'px',
			'width': randomInt($(window).width()/2, $(window).width()) + 'px',
			'top': randomInt(0, $(window).height()) + 'px',
			'left': randomInt(0, $(window).width()/2) + 'px',
			'position': 'fixed',
			'overflow': 'hidden',
			'display': 'block',
			'background': '#FFF'
		});
		// Set random scroll top & scroll left.
		$(div).scrollTop(randomInt(0, $(window).height()));
		$(div).scrollLeft(randomInt(0, 100));

		// Prepare to hide the div
		this.remove(div);
	}

	this.remove = function(div) {
		// Hide the div at a random time interval.
		this.timeouts[div] = setTimeout(function() {
			$(div).hide();
		}, randomInt(glitch_line_duration_min, glitch_line_duration_max));
	}

}