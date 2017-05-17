/**
 * Event component of psychoJS
 * 
 * 
 * This file is part of the PsychoJS javascript engine of PsychoPy.
 * Copyright (c) 2016 Ilixa Ltd. (www.ilixa.com)
 * 
 * Distributed under the terms of the GNU General Public License (GPL).
 */


/**
 * @namespace
 */
psychoJS.event = {}
psychoJS._keyBuffer = []


psychoJS.event._keyDownHandler = function(e) {
	//console.log("key press: code=" + e.code + " key=" + e.key + " keyCode=" + e.keyCode);
	psychoJS._keyBuffer.push({
		code : e.code,
		key : e.key,
		keyCode: e.keyCode,
		timestamp : psychoJS.core.getTime()
	});
	//console.log("keys pressed : " + JSON.stringify(psychoJS._keyBuffer));
}

psychoJS.event.clearKeys = function() {
	psychoJS._keyBuffer = [];
}

/**
 * provide support for browser versions that have not yet adopted the W3C KeyboardEvent.code standard
 * for detecting key presses. This table maps the deprecated KayboardEvent.keycode values to the W3C UI event codes
 .*/
psychoJS.event._keycodeMap = { 
	49 : "Digit1",
	50 : "Digit2",
	51 : "Digit3",
	52 : "Digit4",
	53 : "Digit5",
	54 : "Digit6",
	55 : "Digit7",
	56 : "Digit8",
	57 : "Digit9",
	48 : "Digit0",
	65 : "KeyA",
	66 : "KeyB",
	67 : "KeyC",
	68 : "KeyD",
	69 : "KeyE",
	70 : "KeyF",
	71 : "KeyG",
	72 : "KeyH",
	73 : "KeyI",
	74 : "KeyJ",
	75 : "KeyK",
	76 : "KeyL",
	77 : "KeyM",
	78 : "KeyN",
	79 : "KeyO",
	80 : "KeyP",
	81 : "KeyQ",
	82 : "KeyR",
	83 : "KeyS",
	84 : "KeyT",
	85 : "KeyU",
	86 : "KeyV",
	87 : "KeyW",
	88 : "KeyX",
	89 : "KeyY",
	90 : "KeyZ",
	188 : "Comma",
	190 : "Period",
	186 : "Semicolon",
	222 : "Quote",
	219 : "BracketLeft",
	221 : "BracketRight",
	192 : "Backquote",
	220 : "Backslash",
	189 : "Minus",
	187 : "Equal",
	144 : "NumLock",
	96 : "Numpad0",
	97 : "Numpad1",
	98 : "Numpad2",
	99 : "Numpad3",
	100 : "Numpad4",
	101 : "Numpad5",
	102 : "Numpad6",
	103 : "Numpad7",
	104 : "Numpad8",
	105 : "Numpad9",
	107 : "NumpadAdd",
	194 : "NumpadComma",
	194 : "NumpadComma",
	110 : "NumpadDecimal",
	110 : "NumpadDecimal",
	111 : "NumpadDivide",
	13 : "NumpadEnter",
	12 : "NumpadEqual",
	106 : "NumpadMultiply",
	109 : "NumpadSubtract",
	37 : "ArrowLeft",
	38 : "ArrowUp",
	39 : "ArrowRight",
	40 : "ArrowDown",
	27 : "Escape",
	32 : "Space"
};

/**
 * mapping table for pyglet key names to corresponding W3C KeyboardEvent.codes
 .*/
psychoJS.event._pygletMap = {
	//  writing system keys
	"grave" : "Backquote",
	"backslash" : "Backslash",
	"backspace" : "Backspace",
	"bracketleft" : "BracketLeft",
	"bracketright" : "BracketRight",
	"comma" : "Comma",
	"0" : "Digit0",
	"1" : "Digit1",
	"2" : "Digit2",
	"3" : "Digit3",
	"4" : "Digit4",
	"5" : "Digit5",
	"6" : "Digit6",
	"7" : "Digit7",
	"8" : "Digit8",
	"9" : "Digit9",
	"equal" : "Equal",
	"a" : "KeyA",
	"b" : "KeyB",
	"c" : "KeyC",
	"d" : "KeyD",
	"e" : "KeyE",
	"f" : "KeyF",
	"g" : "KeyG",
	"h" : "KeyH",
	"i" : "KeyI",
	"j" : "KeyJ",
	"k" : "KeyK",
	"l" : "KeyL",
	"m" : "KeyM",
	"n" : "KeyN",
	"o" : "KeyO",
	"p" : "KeyP",
	"q" : "KeyQ",
	"r" : "KeyR",
	"s" : "KeyS",
	"t" : "KeyT",
	"u" : "KeyU",
	"v" : "KeyV",
	"w" : "KeyW",
	"x" : "KeyX",
	"y" : "KeyY",
	"z" : "KeyZ",
	"minus" : "Minus",
	"period" : "Period",
	"apostrophe" : "Quote",
	"semicolon" : "Semicolon",
	"slash" : "Slash",
	
	//  functional keys
	
	"escape" : "Escape",
	"loption" : "AltLeft",
	"roption" : "AltRight",
	"capslock" : "CapsLock",
	"lcontrol" : "ControlLeft",
	"rcontrol" : "ControlRight",
	"return" : "Enter",
	"lcommand" : "MetaLeft",
	"rcommand" : "MetaRight",
	"lshift" : "ShiftLeft",
	"rshift" : "ShiftRight",
	"space" : "Space",
	"tab" : "Tab",
	
	//  arrowpad
	
	"down" : "ArrowDown",
	"left" : "ArrowLeft",
	"right" : "ArrowRight",
	"up" : "ArrowUp",
	
	//  numeric pad
	
	"num_0" : "Numpad0",
	"num_1" : "Numpad1",
	"num_2" : "Numpad2",
	"num_3" : "Numpad3",
	"num_4" : "Numpad4",
	"num_5" : "Numpad5",
	"num_6" : "Numpad6",
	"num_7" : "Numpad7",
	"num_8" : "Numpad8",
	"num_9" : "Numpad9",
	"num_decimal" : "NumpadDecimal",
	"num_enter" : "NumpadEnter",
	"num_add" : "NumpadAdd",
	"num_subtract" : "NumpadSubtract",
	"num_multiply" : "NumpadMultiply",
	"num_divide" : "NumpadDivide",
	"num_equal" : "NumpadEqual",
	"num_numlock" : "NumpadNumlock"
}

psychoJS.event._reversePygletMap = {};
for(keyName in psychoJS.event._pygletMap) {
    psychoJS.event._reversePygletMap[psychoJS.event._pygletMap[keyName]] = keyName;
}


/**
 * convert a keylist that uses pyglet key names to one that uses W3C KeyboardEvent.code values.
 * This allows key lists that work in the builder environment to work in psychoJS web experiments
 .*/

psychoJS.event.pyglet2w3c = function(oldKeyList) {
	newKeyList = [];
	for (i = 0; i < oldKeyList.length; i++) {
		if (psychoJS.event._pygletMap[oldKeyList[i]] == undefined) {
			newKeyList.push(oldKeyList[i]);
		}
		else {
			newKeyList.push(psychoJS.event._pygletMap[oldKeyList[i]]);
		}
	}
	return newKeyList;
}

/**
 * Get the list keys that were pressed.
 * @param keyList - undefined or []. Allows the user to specify a set of keys to check for. Only keypresses from this set of keys will be removed from the keyboard buffer. If the keyList is None all keys will be checked and the key buffer will be cleared completely.
 * @param {boolean} timeStamped - If true will return a list of tuples instead of a list of keynames. Each tuple has (keyname, time).
 * @return the list of keys that were pressed.
 *
 * The w3c key-event viewer can be used to see possible values for the items in the keyList given the user's keyboard and chosen layout.
 * URL: https://w3c.github.io/uievents/tools/key-event-viewer.html
 * The "key" and "code" columns in the UI Events fields are the relevant values for the keyList argument. 
 */
psychoJS.event.getKeys = function(attribs) {
	var keyList = psychoJS.getAttrib(attribs, "keyList", undefined);
	var timeStamped = psychoJS.getAttrib(attribs, "timeStamped", false);

	var newBuffer = [];
	var keys = [];
	if (keyList) {
		keyList = psychoJS.event.pyglet2w3c(keyList);
	}
	for(var i = 0; i < psychoJS._keyBuffer.length; ++i) {
		var key = psychoJS._keyBuffer[i];
		var keyId = undefined;
		if (keyList) {
			var index= keyList.indexOf(key.code);
			if (index < 0) {
				index = keyList.indexOf(psychoJS.event._keycodeMap[key.keyCode]);
	  }
			if (index >= 0) {
				keyId = psychoJS.event._reversePygletMap[keyList[index]];
			}
		}
		else {
			keyId = psychoJS.event._reversePygletMap[key.code];
		}
	
		if (keyId) {
			if (timeStamped) {
				keys.push([keyId, key.timestamp]);
			}
			else {
				keys.push(keyId);
			}
		}
		else {
			newBuffer.push(key); // keep key press in buffer
		}
	}
	
	psychoJS._keyBuffer = newBuffer;
	return keys;
}

/**
 * Clears all events currently in the event buffer.
 */
psychoJS.event.clearEvents = function(attribs) { 
	// TODO : handle attribs
	psychoJS.event.clearKeys();
}

/**
 * Used in scripts created by the builder to keep track of a clock and the current status (whether or not we are currently checking the keyboard)
 */
psychoJS.event.BuilderKeyResponse = function() {
	this.status = psychoJS.NOT_STARTED;
	this.keys = []; // the key(s) pressed
	this.corr = 0;  // was the resp correct this trial? (0=no, 1=yes)
	this.rt = [];  // response time(s)
	this.clock = new psychoJS.core.Clock(); // we'll use this to measure the rt
}




psychoJS.event.mousePos = [0, 0];

psychoJS.event.mouseButtons = [0, 0, 0];

psychoJS.event.mouseWheelRel = [0.0, 0.0];

/**
 * list of 3 clocks that are reset on mouse button presses
 */
psychoJS.event.mouseClick = [new psychoJS.core.Clock(), new psychoJS.core.Clock(), new psychoJS.core.Clock()];

/**
 * container for time elapsed from last reset of mouseClick[n] for any button pressed
 */
psychoJS.event.mouseTimes = [0.0, 0.0, 0.0];


// clock for tracking time of mouse movement, reset when mouse is moved,
// reset on mouse motion:
psychoJS.event.mouseMove = new psychoJS.core.Clock();

psychoJS.event.startMoveClock = function() {
    psychoJS.event.mouseMove = new psychoJS.core.Clock();
}


psychoJS.event.stopMoveClock = function() {
    psychoJS.event.mouseMove = undefined;
}


psychoJS.event.resetMoveClock = function() {
    if (psychoJS.event.mouseMove) {
        psychoJS.event.mouseMove.reset();
	}
    else {
        psychoJS.event.startMoveClock()
	}
}

psychoJS.event._onMouseDown = function(ev) {
	var now = psychoJS.clock.getTime();
	var label = '';
	
	if (ev.button === 0) {
		psychoJS.event.mouseButtons[0] = 1;
		psychoJS.event.mouseTimes[0] = now - psychoJS.event.mouseClick[0].getLastResetTime();
		label += ' Left';
	}
	if (ev.button === 1) {
		psychoJS.event.mouseButtons[1] = 1;
		psychoJS.event.mouseTimes[1] = now - psychoJS.event.mouseClick[1].getLastResetTime();
		label += ' Middle';
	}
	if (ev.button === 2) {
		psychoJS.event.mouseButtons[2] = 1;
		psychoJS.event.mouseTimes[2] = now - psychoJS.event.mouseClick[2].getLastResetTime();
		label += ' Right';
	}
	var x = ev.offsetX;
	var y = ev.offsetY;
	psychoJS.logging.data("Mouse: " + label + " button down, pos=(" + x + "," + y + ")");
}

psychoJS.event._onMouseUp = function(ev) {
	var now = psychoJS.clock.getTime();
	var label = '';
	
	if (ev.button === 0) {
		psychoJS.event.mouseButtons[0] = 0;
		label += ' Left';
	}
	if (ev.button === 1) {
		psychoJS.event.mouseButtons[1] = 0;
		label += ' Middle';
	}
	if (ev.button === 2) {
		psychoJS.event.mouseButtons[2] = 0;
		label += ' Right';
	}
	var x = ev.offsetX;
	var y = ev.offsetY;
	psychoJS.logging.data("Mouse: " + label + " button up, pos=(" + x + "," + y + ")");
}

psychoJS.event._onMouseMove = function(ev) {
	var x = ev.offsetX;
	var y = ev.offsetY;
	psychoJS.event.mousePos = [x, y];
	
    if (psychoJS.event.mouseMove) {
        psychoJS.event.mouseMove.reset();
	}	
}

psychoJS.event._onMouseWheel = function(ev) {
    psychoJS.event.mouseWheelRel = [psychoJS.event.mouseWheelRel[0] + ev.deltaX, psychoJS.event.mouseWheelRel[1] + ev.deltaY];
	var x = ev.offsetX;
	var y = ev.offsetY;
    var msg = "Mouse: wheel shift=(" + ev.deltaX + "," + ev.deltaY + "), pos=(" + x + "," + y + ")";
    psychoJS.logging.data(msg);
}

/**
 * Helper function returning the cartesian distance between p1 and p2
 * @param {array} p1 - The first point
 * @param {array} p2 - The second point
 */
psychoJS.xydist = function(p1, p2) {
	var dx = p1[0] - p2[0];
	var dy = p1[1] - p2[1];
    return Math.sqrt(dx*dx + dy*dy);
}

/**
 * Easy way to track what your mouse is doing.
 * Create your `visual.Window` before creating a Mouse.
 * @constructor
 */
psychoJS.event.Mouse = function() {
	this.lastPos = undefined;
	this.prevPos = undefined; // used for motion detection and timing

	this.win = psychoJS.core.openWindows[0];
	if (this.win !== undefined) {
		psychoJS.logging.info('Mouse: using default window');
	}
	else {
		psychoJS.logging.error('Mouse: failed to get a default visual.Window (need to create one first)');
	}
	

	// for builder: set status to STARTED, NOT_STARTED etc
	this.status = undefined;
	this.mouseClock = psychoJS.core.Clock();
	this.movedistance = 0.0;
	psychoJS.event.mouseButtons = [0, 0, 0];
	
	Object.defineProperty(this, 'units', {
		get : function() { return this.win.units; },
		set : function(value) { /* read only */ }
	});
}


/**
 * Returns the current position of the mouse,
 * in the same units as the class visual.Window (0,0) is at centre
 */
psychoJS.event.Mouse.prototype.getPos = function() {
	var lastPosPix = psychoJS.event.mousePos.slice();
	// set (0,0) to centre
	lastPosPix[1] = this.win.size[1] / 2 - lastPosPix[1];
	lastPosPix[0] = lastPosPix[0] - this.win.size[0] / 2;

	this.lastPos = this._pix2windowUnits(lastPosPix);
	return this.lastPos;
}

/**
 * Determine whether/how far the mouse has moved.
 * With no args returns true if mouse has moved at all since last
 * getPos() call, or distance (x,y) can be set to pos or neg
 * distances from x and y to see if moved either x or y that
 * far from lastPos, or distance can be an int/float to test if
 * new coordinates are more than that far in a straight line
 * from old coords.
 * Retrieve time of last movement from self.mouseClock.getTime().
 * Reset can be to 'here' or to screen coords (x,y) which allows
 * measuring distance from there to mouse when moved. If reset is
 * (x,y) and distance is set, then prevPos is set to (x,y) and
 * distance from (x,y) to here is checked, mouse.lastPos is set as
 * current (x,y) by getPos(), mouse.prevPos holds lastPos from
 * last time mouseMoved was called.
 */
psychoJS.event.Mouse.prototype.mouseMoved = function(attribs) {
	distance = psychoJS.getAttrib(attribs, 'distance', undefined);
	reset = psychoJS.getAttrib(attribs, 'reset', false);
	
	
	if (this.lastPos === undefined) this.getPos(); // this differs from PsychoPy implementation and may be unwarranted, but otherwise we start with lastPos == undefined
	
	// needs initialization before getPos resets lastPos
	this.prevPos = this.lastPos.slice();
	this.getPos(); // sets this.lastPos to current position
	if (!reset) {
		if (distance === undefined) {
			return (this.prevPos[0] != this.lastPos[0])
				|| (this.prevPos[1] != this.lastPos[1]);
		}
		else {
			if (typeof(distance) === 'number') {
				this.movedistance = psychoJS.xydist(this.prevPos, this.lastPos);
				return this.movedistance > distance;
			}
			if (this.prevPos[0] + distance[0] - this.lastPos[0] > 0.0) {
				return true; // moved on X-axis
			}
			if (this.prevPos[1] + distance[1] - this.lastPos[0] > 0.0) {
				return true; // moved on Y-axis
			}
			return false;
		}
	}
	if (reset === true) {
		// just reset the last move time: starts/zeroes the move clock
		psychoJS.event.mouseMove.reset(); // resets the global mouseMove clock // TODO
		return false;
	}
	if (reset === 'here') {
		// set to wherever we are
		this.prevPos = copy.copy(this.lastPos); // lastPos set in getPos()
		return false;
	}
	if (reset instanceof Array) {
		// an (x,y) array
		// reset to (x,y) to check movement from there
		this.prevPos = reset.slice();
		if (!distance) {
			return false; // just resetting prevPos, not checking distance
		}
		else {
			// checking distance of current pos to newly reset prevposition
			if (typeof(distance) === 'number') {
				this.movedistance = psychoJS.xydist(this.prevPos, this.lastPos);
				return this.movedistance > distance;
			}

			if (Math.abs(this.lastPos[0] - this.prevPos[0]) > distance[0]) {
				return true;  // moved on X-axis
			}
			if (Math.abs(this.lastPos[1] - this.prevPos[1]) > distance[1]) {
				return true;  // moved on Y-axis
			}
			return false;
		}
	}
	return false;
}


psychoJS.event.Mouse.prototype.mouseMoveTime = function() {
	if (psychoJS.event.mouseMove) {
		return psychoJS.event.mouseMove.getTime();
	}
	else {
		return 0; // mouseMove clock not started
	}
}

/**
 * Returns the new position of the mouse relative to the
 * last call to getRel or getPos, in the same units as the
 * class visual.Window.
 */
psychoJS.event.Mouse.prototype.getRel = function() { 
	var relPos;
	
	// NB getPost() resets lastPos so MUST retrieve lastPos first
	if (this.lastPos === undefined) {
		relPos = this.getPos();
	}
	else {
		// DON't switch to (this-lastPos)
		var lastPos = this.lastPos;
		var pos = this.getPos();
		relPos = [-lastPos[0] + pos[0], -lastPos[1] + pos[1]];
	}
	return relPos;
}

/**
 * Returns the travel of the mouse scroll wheel since last call.
 * Returns a [x, y] array but for most wheels y is the only
 * value that will change (except Mac mighty mice?)
 */
psychoJS.event.Mouse.prototype.getWheelRel = function() {
	var rel = psychoJS.event.mouseWheelRel;
	psychoJS.event.mouseWheelRel = [0, 0];
	return rel;
}

/**
 * Gets the visibility of the mouse (1 or 0)
 * (currently always returns 1)
 */
psychoJS.event.Mouse.prototype.getVisible = function() {
	return 1;
}

/**
 * Sets the visibility of the mouse (1 or 0)
 * (currently not implemented)
 */
psychoJS.event.Mouse.prototype.setVisible = function(visible) {
}


/**
 * Reset a 3-item list of core.Clocks use in timing button clicks.
 * The default is to reset all, but they can be reset individually as
 * specified in buttons list
 */
psychoJS.event.Mouse.prototype.clickReset = function(buttons) {
	buttons = buttons || [0, 1, 2];
	for (var i = 0; i < buttons.length; ++i) {
		var c = buttons[i];
		psychoJS.event.mouseClick[c].reset();
		psychoJS.event.mouseTimes[c] = 0.0;
	}
}

/**
 * Returns a 3-item list indicating whether or not buttons 0,1,2
 * are currently pressed.
 * If `getTime=true` (false by default) then `getPressed` will
 * return all buttons that have been pressed since the last call
 * to `mouse.clickReset` as well as their time stamps::
 *  * buttons = mouse.getPressed()
 *  * buttons, times = mouse.getPressed(true)
 * Typically you want to call `mouse.clickReset()` at stimulus
 * onset, then after the button is pressed in reaction to it, the
 * total time elapsed from the last reset to click is in mouseTimes.
 * This is the actual RT, regardless of when the call to `getPressed()`
 * was made.
 */
psychoJS.event.Mouse.prototype.getPressed = function(getTime) {
	getTime = getTime || false;
	
	if (!getTime) {
		return psychoJS.event.mouseButtons;
	}
	else {
		return [psychoJS.event.mouseButtons, psychoJS.event.mouseTimes];
	}
}

psychoJS.event.Mouse.prototype._pix2windowUnits = function(pos) {
	if (this.win.units === 'pix') {
		return pos;
	}
	else if (this.win.units === 'norm') {
		return [pos[0] * 2.0 / this.win.size[0], pos[1] * 2.0 / this.win.size[1]];
	}
	else if (this.win.units === 'height') {
		return [pos[0] / this.win.size[1], pos[1] / this.win.size[1]];
	}
}

psychoJS.event.Mouse.prototype._windowUnits2pix = function(pos) {
	if (this.win.units === 'pix') {
		return pos;
	}
	else if (this.win.units === 'norm') {
		return [pos[0] * this.win.size[0] / 2.0, pos[1] * this.win.size[1] / 2.0];
	}
	else if (this.win.units === 'height') {
		return [pos[0] * this.win.size[1], pos[1] * this.win.size[1]];
	}
}
