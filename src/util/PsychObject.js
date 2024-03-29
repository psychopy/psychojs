/** @module util */
/**
 * Core Object.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import { EventEmitter } from "./EventEmitter.js";
import * as util from "./Util.js";

/**
 * <p>PsychoObject is the base class for all PsychoJS objects.
 * It is responsible for handling attributes.</p>
 *
 * @extends EventEmitter
 */
export class PsychObject extends EventEmitter
{
	/**
	 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
	 * @param {string} name - the name of the object (mostly useful for debugging)
	 */
	constructor(psychoJS, name)
	{
		super();

		this._psychoJS = psychoJS;
		this._userAttributes = new Set();

		// name:
		if (typeof name === "undefined")
		{
			name = this.constructor.name;
		}
		this._addAttribute("name", name);
	}

	/**
	 * Get the PsychoJS instance.
	 *
	 * @return {PsychoJS} the PsychoJS instance
	 */
	get psychoJS()
	{
		return this._psychoJS;
	}

	/**
	 * Setter for the PsychoJS attribute.
	 *
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
	 * @return {string} the representation
	 */
	toString()
	{
		let representation = this.constructor.name + "( ";
		let addComma = false;
		for (const attribute of this._userAttributes)
		{
			if (addComma)
			{
				representation += ", ";
			}
			addComma = true;

			let value = util.toString(this["_" + attribute]);
			const l = value.length;
			if (l > 50)
			{
				if (value[l - 1] === ")")
				{
					value = value.substring(0, 50) + "~)";
				}
				else
				{
					value = value.substring(0, 50) + "~";
				}
			}

			representation += attribute + "=" + value;
		}
		representation += " )";

		return representation;
	}

	/**
	 * Set the value of an attribute.
	 *
	 * @protected
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
		const response = {
			origin: "PsychObject.setAttribute",
			context: "when setting the attribute of an object",
		};

		if (typeof attributeName == "undefined")
		{
			throw Object.assign(response, {
				error: "the attribute name cannot be"
					+ " undefined",
			});
		}
		if (typeof attributeValue == "undefined")
		{
			this._psychoJS.logger.warn("setting the value of attribute: " + attributeName + " in PsychObject: " + this._name + " as: undefined");
		}

		// (*) apply operation to old and new values:
		if (typeof operation !== "undefined" && this.hasOwnProperty("_" + attributeName))
		{
			let oldValue = this["_" + attributeName];

			// operations can only be applied to numbers and array of numbers (which can be empty):
			if (typeof attributeValue == "number" || (Array.isArray(attributeValue) && (attributeValue.length === 0 || typeof attributeValue[0] == "number")))
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
								error: "old and new"
									+ " value should have"
									+ " the same size when they are both arrays",
							});
						}

						switch (operation)
						{
							case "":
								// no change to value;
								break;
							case "+":
								attributeValue = attributeValue.map((v, i) => oldValue[i] + v);
								break;
							case "*":
								attributeValue = attributeValue.map((v, i) => oldValue[i] * v);
								break;
							case "-":
								attributeValue = attributeValue.map((v, i) => oldValue[i] - v);
								break;
							case "/":
								attributeValue = attributeValue.map((v, i) => oldValue[i] / v);
								break;
							case "**":
								attributeValue = attributeValue.map((v, i) => oldValue[i] ** v);
								break;
							case "%":
								attributeValue = attributeValue.map((v, i) => oldValue[i] % v);
								break;
							default:
								throw Object.assign(response, {
									error: "unsupported"
										+ " operation: " + operation + " when setting: " + attributeName + " in: " + this.name,
								});
						}
					}
					// old value is a scalar
					else
					{
						switch (operation)
						{
							case "":
								// no change to value;
								break;
							case "+":
								attributeValue = attributeValue.map((v) => oldValue + v);
								break;
							case "*":
								attributeValue = attributeValue.map((v) => oldValue * v);
								break;
							case "-":
								attributeValue = attributeValue.map((v) => oldValue - v);
								break;
							case "/":
								attributeValue = attributeValue.map((v) => oldValue / v);
								break;
							case "**":
								attributeValue = attributeValue.map((v) => oldValue ** v);
								break;
							case "%":
								attributeValue = attributeValue.map((v) => oldValue % v);
								break;
							default:
								throw Object.assign(response, {
									error: "unsupported"
										+ " value: " + JSON.stringify(attributeValue) + " for"
										+ " operation: " + operation + " when setting: " + attributeName + " in: " + this.name,
								});
						}
					}
				}
				// value is a scalar
				else
				{
					// old value is an array
					if (Array.isArray(oldValue))
					{
						switch (operation)
						{
							case "":
								attributeValue = oldValue.map((v) => attributeValue);
								break;
							case "+":
								attributeValue = oldValue.map((v) => v + attributeValue);
								break;
							case "*":
								attributeValue = oldValue.map((v) => v * attributeValue);
								break;
							case "-":
								attributeValue = oldValue.map((v) => v - attributeValue);
								break;
							case "/":
								attributeValue = oldValue.map((v) => v / attributeValue);
								break;
							case "**":
								attributeValue = oldValue.map((v) => v ** attributeValue);
								break;
							case "%":
								attributeValue = oldValue.map((v) => v % attributeValue);
								break;
							default:
								throw Object.assign(response, {
									error: "unsupported"
										+ " operation: " + operation + " when setting: " + attributeName + " in: " + this.name,
								});
						}
					}
					// old value is a scalar
					else
					{
						switch (operation)
						{
							case "":
								// no change to value;
								break;
							case "+":
								attributeValue = oldValue + attributeValue;
								break;
							case "*":
								attributeValue = oldValue * attributeValue;
								break;
							case "-":
								attributeValue = oldValue - attributeValue;
								break;
							case "/":
								attributeValue = oldValue / attributeValue;
								break;
							case "**":
								attributeValue = oldValue ** attributeValue;
								break;
							case "%":
								attributeValue = oldValue % attributeValue;
								break;
							default:
								throw Object.assign(response, {
									error: "unsupported"
										+ " value: " + JSON.stringify(attributeValue) + " for operation: " + operation + " when setting: " + attributeName + " in: " + this.name,
								});
						}
					}
				}
			}
			else
			{
				throw Object.assign(response, {
					error: "operation: " + operation + " is invalid for old value: " + JSON.stringify(oldValue) + " and new value: " + JSON.stringify(attributeValue),
				});
			}
		}

		// (*) log if appropriate:
		if (!stealth && (log || this._autoLog) && (typeof this.win !== "undefined"))
		{
			const msg = this.name + ": " + attributeName + " = " + util.toString(attributeValue);
			this.win.logOnFlip({
				msg,
				// obj: this
			});
		}

		// (*) set the value of the attribute and return whether it has changed:
		const previousAttributeValue = this["_" + attributeName];
		this["_" + attributeName] = attributeValue;

		// Things seem OK without this check except for 'vertices'
		if (typeof previousAttributeValue === "undefined")
		{
			// Not that any of the following lines should throw, but evaluating
			// `this._vertices.map` on `ShapeStim._getVertices_px()` seems to
			return false;
		}

		// Need check for equality differently for each type of attribute somehow,
		// Lodash has an example of what an all encompassing solution looks like below,
		// https://github.com/lodash/lodash/blob/master/.internal/baseIsEqualDeep.js
		const prev = util.toString(previousAttributeValue);
		const next = util.toString(attributeValue);

		// The following check comes in handy when figuring out a `hasChanged` predicate
		// in a `ShapeStim.setPos()` call for example. Objects that belong to us, such as
		// colors, feature a `toString()` method of their own. The types of input that
		// `Util.toString()` might try, but fail to stringify in a meaningful way are assigned
		// an 'Object (circular)' string representation. For being opaque as to their raw
		// value, those types of input are liable to produce PIXI updates.
		return prev === "Object (circular)" || next === "Object (circular)" || prev !== next;
	}

	/**
	 * Add an attribute to this instance (e.g. define setters and getters) and affect a value to it.
	 *
	 * @protected
	 * @param {string} name - the name of the attribute
	 * @param {object} value - the value of the attribute
	 * @param {object} [defaultValue] - the default value for the attribute
	 * @param {function} [onChange] - function called upon changes to the attribute value
	 */
	_addAttribute(name, value, defaultValue = undefined, onChange = () =>
	{})
	{
		const getPropertyName = "get" + name[0].toUpperCase() + name.substr(1);
		if (typeof this[getPropertyName] === "undefined")
		{
			this[getPropertyName] = () => this["_" + name];
		}

		const setPropertyName = "set" + name[0].toUpperCase() + name.substr(1);
		if (typeof this[setPropertyName] === "undefined")
		{
			this[setPropertyName] = (value, log = false) =>
			{
				if (typeof value === "undefined" || value === null)
				{
					value = defaultValue;
				}
				const hasChanged = this._setAttribute(name, value, log);
				if (hasChanged)
				{
					onChange();
				}
			};
		}
		else
		{
			// deal with default value:
			if (typeof value === "undefined" || value === null)
			{
				value = defaultValue;
			}
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
			},
		});

		// note: we use this[name] instead of this['_' + name] since a this.set<Name> method may available
		// in the object, in which case we need to call it
		this[name] = value;
		// this['_' + name] = value;

		this._userAttributes.add(name);
	}
}
