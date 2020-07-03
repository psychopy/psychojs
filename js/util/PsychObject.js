/** @module util */
/**
 * Core Object.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import {EventEmitter} from './EventEmitter';
import * as util from './Util';


/**
 * <p>PsychoObject is the base class for all PsychoJS objects.
 * It is responsible for handling attributes.</p>
 *
 * @class
 * @extends EventEmitter
 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
 * @param {string} name - the name of the object (mostly useful for debugging)
 */
export class PsychObject extends EventEmitter
{
	constructor(psychoJS, name)
	{
		super();

		this._psychoJS = psychoJS;
		this._userAttributes = new Set();

		// name:
		if (typeof name === 'undefined')
		{
			name = this.constructor.name;
		}
		this._addAttribute('name', name);
	}


	/**
	 * Get the PsychoJS instance.
	 *
	 * @public
	 * @return {PsychoJS} the PsychoJS instance
	 */
	get psychoJS()
	{
		return this._psychoJS;
	}


	/**
	 * Setter for the PsychoJS attribute.
	 *
	 * @public
	 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
	 */
	set psychoJS(psychoJS)
	{
		this._psychoJS = psychoJS;
	}


	/**
	 * String representation of the PsychObject.
	 *
	 * <p>Note: attribute values are limited to 50 characters.</p>
	 *
	 * @public
	 * @return {string} the representation
	 */
	toString()
	{
		let representation = this.constructor.name + '( ';
		let addComma = false;
		for (const attribute of this._userAttributes)
		{
			if (addComma)
			{
				representation += ', ';
			}
			addComma = true;

			let value = util.toString(this['_' + attribute]);
			const l = value.length;
			if (l > 50)
			{
				if (value[l - 1] === ')')
				{
					value = value.substring(0, 50) + '~)';
				}
				else
				{
					value = value.substring(0, 50) + '~';
				}
			}

			representation += attribute + '=' + value;
		}
		representation += ' )';

		return representation;
	}


	/**
	 * Set the value of an attribute.
	 *
	 * @private
	 * @param {string} attributeName - the name of the attribute
	 * @param {object} attributeValue - the value of the attribute
	 * @param {boolean} [log= false] - whether of not to log
	 * @param {string} [operation] - the binary operation such that the new value of the attribute is the result of the application of the operation to the current value of the attribute and attributeValue
	 * @param {boolean} [stealth= false] - whether or not to call the potential attribute setters when setting the value of this attribute
	 * @return {boolean} whether or not the value of that attribute has changed (false if the attribute
	 * was not previously set)
	 */
	_setAttribute(attributeName, attributeValue, log = false, operation = undefined, stealth = false)
	{
		const response = {origin: 'PsychObject.setAttribute', context: 'when setting the attribute of an object'};

		if (typeof attributeName == 'undefined')
		{
			throw Object.assign(response, {
				error: 'the attribute name cannot be' +
					' undefined'
			});
		}
		if (typeof attributeValue == 'undefined')
		{
			this._psychoJS.logger.warn('setting the value of attribute: ' + attributeName + ' in PsychObject: ' + this._name + ' as: undefined');
		}

		// (*) apply operation to old and new values:
		if (typeof operation !== 'undefined' && this.hasOwnProperty('_' + attributeName))
		{
			let oldValue = this['_' + attributeName];

			// operations can only be applied to numbers and array of numbers (which can be empty):
			if (typeof attributeValue == 'number' || (Array.isArray(attributeValue) && (attributeValue.length === 0 || typeof attributeValue[0] == 'number')))
			{

				// value is an array:
				if (Array.isArray(attributeValue))
				{
					// old value is also an array
					if (Array.isArray(oldValue))
					{
						if (attributeValue.length !== oldValue.length)
						{
							throw Object.assign(response, {
								error: 'old and new' +
									' value should have' +
									' the same size when they are both arrays'
							});
						}

						switch (operation)
						{
							case '':
								// no change to value;
								break;
							case '+':
								attributeValue = attributeValue.map((v, i) => oldValue[i] + v);
								break;
							case '*':
								attributeValue = attributeValue.map((v, i) => oldValue[i] * v);
								break;
							case '-':
								attributeValue = attributeValue.map((v, i) => oldValue[i] - v);
								break;
							case '/':
								attributeValue = attributeValue.map((v, i) => oldValue[i] / v);
								break;
							case '**':
								attributeValue = attributeValue.map((v, i) => oldValue[i] ** v);
								break;
							case '%':
								attributeValue = attributeValue.map((v, i) => oldValue[i] % v);
								break;
							default:
								throw Object.assign(response, {
									error: 'unsupported' +
										' operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
								});
						}

					}
					else
					// old value is a scalar
					{
						switch (operation)
						{
							case '':
								// no change to value;
								break;
							case '+':
								attributeValue = attributeValue.map(v => oldValue + v);
								break;
							case '*':
								attributeValue = attributeValue.map(v => oldValue * v);
								break;
							case '-':
								attributeValue = attributeValue.map(v => oldValue - v);
								break;
							case '/':
								attributeValue = attributeValue.map(v => oldValue / v);
								break;
							case '**':
								attributeValue = attributeValue.map(v => oldValue ** v);
								break;
							case '%':
								attributeValue = attributeValue.map(v => oldValue % v);
								break;
							default:
								throw Object.assign(response, {
									error: 'unsupported' +
										' value: ' + JSON.stringify(attributeValue) + ' for' +
										' operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
								});
						}
					}
				}
				else
				// value is a scalar
				{
					// old value is an array
					if (Array.isArray(oldValue))
					{
						switch (operation)
						{
							case '':
								attributeValue = oldValue.map(v => attributeValue);
								break;
							case '+':
								attributeValue = oldValue.map(v => v + attributeValue);
								break;
							case '*':
								attributeValue = oldValue.map(v => v * attributeValue);
								break;
							case '-':
								attributeValue = oldValue.map(v => v - attributeValue);
								break;
							case '/':
								attributeValue = oldValue.map(v => v / attributeValue);
								break;
							case '**':
								attributeValue = oldValue.map(v => v ** attributeValue);
								break;
							case '%':
								attributeValue = oldValue.map(v => v % attributeValue);
								break;
							default:
								throw Object.assign(response, {
									error: 'unsupported' +
										' operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
								});
						}

					}
					else
					// old value is a scalar
					{
						switch (operation)
						{
							case '':
								// no change to value;
								break;
							case '+':
								attributeValue = oldValue + attributeValue;
								break;
							case '*':
								attributeValue = oldValue * attributeValue;
								break;
							case '-':
								attributeValue = oldValue - attributeValue;
								break;
							case '/':
								attributeValue = oldValue / attributeValue;
								break;
							case '**':
								attributeValue = oldValue ** attributeValue;
								break;
							case '%':
								attributeValue = oldValue % attributeValue;
								break;
							default:
								throw Object.assign(response, {
									error: 'unsupported' +
										' value: ' + JSON.stringify(attributeValue) + ' for operation: ' + operation + ' when setting: ' + attributeName + ' in: ' + this.name
								});
						}
					}
				}

			}
			else
			{
				throw Object.assign(response, {error: 'operation: ' + operation + ' is invalid for old value: ' + JSON.stringify(oldValue) + ' and new value: ' + JSON.stringify(attributeValue)});
			}
		}


		// (*) log if appropriate:
		if (!stealth && (log || this._autoLog) && (typeof this.win !== 'undefined'))
		{
			const msg = this.name + ": " + attributeName + " = " + JSON.stringify(attributeValue);
			this.win.logOnFlip({
				msg,
				// obj: this
			});
		}


		// (*) set the value of the attribute and return whether it has changed:
		const previousAttributeValue = this['_' + attributeName];
		this['_' + attributeName] = attributeValue;

		return (attributeValue !== previousAttributeValue);
	}


	/**
	 * Add attributes to this instance (e.g. define setters and getters) and affect values to them.
	 *
	 * <p>Notes:
	 * <ul>
	 * <li> If the object already has a set<attributeName> method, we do not redefine it,
	 * and the setter for this attribute calls that method instead of _setAttribute.</li>
	 * <li> _addAttributes is typically called in the constructor of an object, after
	 * the call to super (see module:visual.ImageStim for an illustration).</li>
	 * </ul></p>
	 *
	 * @protected
	 * @param {Object} cls - the class object of the subclass of PsychoObject whose attributes we will set
	 * @param {...*} [args] - the values for the attributes (this also determines which attributes will be set)
	 *
	 */
	_addAttributes(cls, ...args)
	{
		// (*) look for the line in the subclass constructor where addAttributes is called
		// and extract its arguments:
		const callLine = cls.toString().match(/this.*\._addAttributes\(.*\;/)[0];
		const startIndex = callLine.indexOf('._addAttributes(') + 16;
		const endIndex = callLine.indexOf(');');
		const callArgs = callLine.substr(startIndex, endIndex - startIndex).split(',').map((s) => s.trim());


		// (*) add (argument name, argument value) pairs to the attribute map:
		let attributeMap = new Map();
		for (let i = 1; i < callArgs.length; ++i)
		{
			attributeMap.set(callArgs[i], args[i - 1]);
		}

		// (*) set the value, define the get/set<attributeName> properties and define the getter and setter:
		for (let [name, value] of attributeMap.entries())
		{
			this._addAttribute(name, value);
		}
	}


	/**
	 * Add an attribute to this instance (e.g. define setters and getters) and affect a value to it.
	 *
	 * @protected
	 * @param {string} name - the name of the attribute
	 * @param {object} value - the value of the attribute
	 */
	_addAttribute(name, value)
	{
		const getPropertyName = 'get' + name[0].toUpperCase() + name.substr(1);
		if (typeof this[getPropertyName] === 'undefined')
		{
			this[getPropertyName] = () => this['_' + name];
		}

		const setPropertyName = 'set' + name[0].toUpperCase() + name.substr(1);
		if (typeof this[setPropertyName] === 'undefined')
		{
			this[setPropertyName] = (value, log = false) =>
			{
				this._setAttribute(name, value, log);
			};
		}

		Object.defineProperty(this, name, {
			configurable: true,
			get()
			{
				return this[getPropertyName](); /* return this['_' + name];*/
			},
			set(value)
			{
				this[setPropertyName](value);
			}
		});

		// note: we use this[name] instead of this['_' + name] since a this.set<Name> method may available
		// in the object, in which case we need to call it
		this[name] = value;
		//this['_' + name] = value;

		this._userAttributes.add(name);
	}

}
