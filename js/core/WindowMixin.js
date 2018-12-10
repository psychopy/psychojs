/**
 * Mixin implementing various unit-handling measurement methods.
 * 
 * @author Alain Pitiot
 * @version 3.0.0b11
 * @copyright (c) 2018 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


/**
 * <p>This mixin implements various unit-handling measurement methods.</p>
 * 
 * <p>Note: (a) this is the equivalent of PsychoPY's WindowMixin.
 *          (b) it will most probably be made obsolete by a fully-integrated unit approach.
 * </p>
 * 
 * @name module:core.WindowMixin
 * @mixin
 * 
 */
export let WindowMixin = (superclass) => class extends superclass {
	constructor(args) {
		super(args);
	}


	/**
	 * Setter for units attribute.
	 * 
	 * @name module:core.WindowMixin#setUnits
	 * @function
	 * @public
	 * @param {String} [units= this.win.units] - the units
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setUnits(units = this.win.units, log = false) {
		this._setAttribute('units', units, log);
	}


	/**
	 * Convert the given length from stimulus unit to pixel units.
	 * 
	 * @name module:core.WindowMixin#_getLengthPix
	 * @function
	 * @protected
	 * @param {number} length - the length in stimulus units
	 * @return {number} - the length in pixel units
	 */
	_getLengthPix(length) {
		let errorPrefix = { origin: 'WindowMixin._getLengthPix', context: 'when converting a length from stimulus unit to pixel units' };

		if (this._units === 'pix') {
			return length;
		}
		else if (typeof this._units === 'undefined' || this._units === 'norm') {
			var winSize = this.win.size;
			return length * winSize[1] / 2; // TODO: how do we handle norm when width != height?
		}
		else if (this._units === 'height') {
			const minSize = Math.min(this.win.size[0], this.win.size[1]);
			return length * minSize;
		}
		else {
			throw { ...errorPrefix, error: 'unable to deal with unit: ' + this._units };
		}
	}


	/**
	 * Convert the given length from pixel units to the stimulus units
	 * 
	 * @name module:core.WindowMixin#_getLengthUnits
	 * @function
	 * @protected
	 * @param {number} length_px - the length in pixel units
	 * @return {number} - the length in stimulus units
	 */
	_getLengthUnits(length_px) {
		let errorPrefix = { origin: 'WindowMixin._getLengthUnits', context: 'when converting a length from pixel unit to stimulus units' };

		if (this._units === 'pix') {
			return length_px;
		}
		else if (typeof this._units === 'undefined' || this._units === 'norm') {
			const winSize = this.win.size;
			return length_px / (winSize[1] / 2); // TODO: how do we handle norm when width != height?
		}
		else if (this._units === 'height') {
			const minSize = Math.min(this.win.size[0], this.win.size[1]);
			return length_px / minSize;
		}
		else {
			throw { ...errorPrefix, error: 'unable to deal with unit: ' + this._units };
		}
	}


	/**
	 * Convert the given length from pixel units to the stimulus units
	 * 
	 * @name module:core.WindowMixin#_getHorLengthPix
	 * @function
	 * @protected
	 * @param {number} length_px - the length in pixel units
	 * @return {number} - the length in stimulus units
	 */
	_getHorLengthPix(length) {
		let errorPrefix = { origin: 'WindowMixin._getHorLengthPix', context: 'when converting a length from pixel unit to stimulus units' };

		if (this._units === 'pix') {
			return length;
		}
		else if (typeof this._units === 'undefined' || this._units === 'norm') {
			var winSize = this.win.size;
			return length * winSize[0] / 2;
		}
		else if (this._units === 'height') {
			const minSize = Math.min(this.win.size[0], this.win.size[1]);
			return length * minSize;
		}
		else {
			throw { ...errorPrefix, error: 'unable to deal with unit: ' + this._units };
		}
	}

	/**
	 * Convert the given length from pixel units to the stimulus units
	 * 
	 * @name module:core.WindowMixin#_getVerLengthPix
	 * @function
	 * @protected
	 * @param {number} length_px - the length in pixel units
	 * @return {number} - the length in stimulus units
	 */
	_getVerLengthPix(length) {
		let errorPrefix = { origin: 'WindowMixin._getVerLengthPix', context: 'when converting a length from pixel unit to stimulus units' };

		if (this._units === 'pix') {
			return length;
		}
		else if (typeof this._units === 'undefined' || this._units === 'norm') {
			var winSize = this.win.size;
			return length * winSize[1] / 2;
		}
		else if (this._units === 'height') {
			const minSize = Math.min(this.win.size[0], this.win.size[1]);
			return length * minSize;
		}
		else {
			throw { ...errorPrefix, error: 'unable to deal with unit: ' + this._units };
		}
	}

}
