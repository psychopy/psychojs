/**
 * TextInput encapsulates an html <input> element into a PIXI Container.
 *
 * @author 'Mwni' (https://github.com/Mwni)
 * @copyright (c) 2018 Mwni
 * @license Distributed under the terms of the MIT License
 *
 * @note TextInput was initially developed by 'Mwni' and is available under the MIT License.
 * We are currently using it almost as is but will be making modification in the near future.
 */

export class TextInput extends PIXI.Container
{
	constructor(styles)
	{
		super();
		this._input_style = Object.assign(
			{
				position: 'absolute',
				background: 'none',
				border: 'none',
				outline: 'none',
				transformOrigin: '0 0',
				lineHeight: '1'
			},
			styles.input
		);

		if (styles.box)
		{
			this._box_generator = typeof styles.box === 'function' ? styles.box : new DefaultBoxGenerator(styles.box);
		}
		else
		{
			this._box_generator = null;
		}

		if (this._input_style.hasOwnProperty('multiline'))
		{
			this._multiline = !!this._input_style.multiline;
			delete this._input_style.multiline;
		}
		else
		{
			this._multiline = false;
		}

		this._box_cache = {};
		this._previous = {};
		this._dom_added = false;
		this._dom_visible = true;
		this._placeholder = '';
		this._placeholderColor = 0xa9a9a9;
		this._selection = [0, 0];
		this._restrict_value = '';
		this._createDOMInput();
		this.substituteText = true;
		this._setState('DEFAULT');
		this._addListeners();
	}


	// GETTERS & SETTERS

	get substituteText()
	{
		return this._substituted;
	}

	set substituteText(substitute)
	{
		if (this._substituted == substitute)
		{
			return;
		}

		this._substituted = substitute;

		if (substitute)
		{
			this._createSurrogate();
			this._dom_visible = false;
		}
		else
		{
			this._destroySurrogate();
			this._dom_visible = true;
		}
		this.placeholder = this._placeholder;
		this._update();
	}

	get placeholder()
	{
		return this._placeholder;
	}

	set placeholder(text)
	{
		this._placeholder = text;
		if (this._substituted)
		{
			this._updateSurrogate();
			this._dom_input.placeholder = '';
		}
		else
		{
			this._dom_input.placeholder = text;
		}
	}

	get disabled()
	{
		return this._disabled;
	}

	set disabled(disabled)
	{
		this._disabled = disabled;
		this._dom_input.disabled = disabled;
		this._setState(disabled ? 'DISABLED' : 'DEFAULT');
	}

	get maxLength()
	{
		return this._max_length;
	}

	set maxLength(length)
	{
		this._max_length = length;
		this._dom_input.setAttribute('maxlength', length);
	}

	get restrict()
	{
		return this._restrict_regex;
	}

	set restrict(regex)
	{
		if (regex instanceof RegExp)
		{
			regex = regex.toString().slice(1, -1);

			if (regex.charAt(0) !== '^')
			{
				regex = '^' + regex;
			}

			if (regex.charAt(regex.length - 1) !== '$')
			{
				regex = regex + '$';
			}

			regex = new RegExp(regex);
		}
		else
		{
			regex = new RegExp('^[' + regex + ']*$');
		}

		this._restrict_regex = regex;
	}

	get text()
	{
		return this._dom_input.value;
	}

	set text(text)
	{
		this._dom_input.value = text;
		if (this._substituted)
		{
			this._updateSurrogate();
		}
	}

	get htmlInput()
	{
		return this._dom_input;
	}

	focus()
	{
		if (this._substituted && !this.dom_visible)
		{
			this._setDOMInputVisible(true);
		}

		this._dom_input.focus();

	}

	blur()
	{
		this._dom_input.blur();
	}

	select()
	{
		this.focus();
		this._dom_input.select();
	}

	setInputStyle(key, value)
	{
		this._input_style[key] = value;
		this._dom_input.style[key] = value;

		if (this._substituted && (key === 'fontFamily' || key === 'fontSize'))
		{
			this._updateFontMetrics();
		}

		if (this._last_renderer)
		{
			this._update();
		}
	}

	destroy(options)
	{
		this._destroyBoxCache();
		super.destroy(options);
	}


	// SETUP

	_createDOMInput()
	{
		if (this._multiline)
		{
			this._dom_input = document.createElement('textarea');
			this._dom_input.style.resize = 'none';
		}
		else
		{
			this._dom_input = document.createElement('input');
			this._dom_input.type = 'text';
		}

		for (let key in this._input_style)
		{
			this._dom_input.style[key] = this._input_style[key];
		}
	}

	_addListeners()
	{
		this.on('added', this._onAdded.bind(this));
		this.on('removed', this._onRemoved.bind(this));
		this._dom_input.addEventListener('keydown', this._onInputKeyDown.bind(this));
		this._dom_input.addEventListener('input', this._onInputInput.bind(this));
		this._dom_input.addEventListener('keyup', this._onInputKeyUp.bind(this));
		this._dom_input.addEventListener('focus', this._onFocused.bind(this));
		this._dom_input.addEventListener('blur', this._onBlurred.bind(this));
	}

	_onInputKeyDown(e)
	{
		this._selection = [
			this._dom_input.selectionStart,
			this._dom_input.selectionEnd
		];

		this.emit('keydown', e.keyCode);
	}

	_onInputInput(e)
	{
		if (this._restrict_regex)
		{
			this._applyRestriction();
		}

		if (this._substituted)
		{
			this._updateSubstitution();
		}

		this.emit('input', this.text);
	}

	_onInputKeyUp(e)
	{
		this.emit('keyup', e.keyCode);
	}

	_onFocused()
	{
		this._setState('FOCUSED');
		this.emit('focus');
	}

	_onBlurred()
	{
		this._setState('DEFAULT');
		this.emit('blur');
	}

	_onAdded()
	{
		document.body.appendChild(this._dom_input);
		this._dom_input.style.display = 'none';
		this._dom_added = true;
	}

	_onRemoved()
	{
		document.body.removeChild(this._dom_input);
		this._dom_added = false;
	}

	_setState(state)
	{
		this.state = state;
		this._updateBox();
		if (this._substituted)
		{
			this._updateSubstitution();
		}
	}


	// RENDER & UPDATE

	// for pixi v4
	renderWebGL(renderer)
	{
		super.renderWebGL(renderer);
		this._renderInternal(renderer);
	}

	// for pixi v4
	renderCanvas(renderer)
	{
		super.renderCanvas(renderer);
		this._renderInternal(renderer);
	}

	// for pixi v5
	render(renderer)
	{
		super.render(renderer);
		this._renderInternal(renderer);
	}

	_renderInternal(renderer)
	{
		this._resolution = renderer.resolution;
		this._last_renderer = renderer;
		this._canvas_bounds = this._getCanvasBounds();
		if (this._needsUpdate())
		{
			this._update();
		}
	}

	_update()
	{
		this._updateDOMInput();
		if (this._substituted)
		{
			this._updateSurrogate();
		}
		this._updateBox();
	}

	_updateBox()
	{
		if (!this._box_generator)
		{
			return;
		}

		if (this._needsNewBoxCache())
		{
			this._buildBoxCache();
		}

		if (this.state == this._previous.state && this._box == this._box_cache[this.state])
		{
			return;
		}

		if (this._box)
		{
			this.removeChild(this._box);
		}

		this._box = this._box_cache[this.state];
		this.addChildAt(this._box, 0);
		this._previous.state = this.state;
	}

	_updateSubstitution()
	{
		if (this.state === 'FOCUSED')
		{
			this._dom_visible = true;
			this._surrogate.visible = this.text.length === 0;
		}
		else
		{
			this._dom_visible = false;
			this._surrogate.visible = true;
		}
		this._updateDOMInput();
		this._updateSurrogate();
	}

	_updateDOMInput()
	{
		if (!this._canvas_bounds)
		{
			return;
		}

		this._dom_input.style.top = (this._canvas_bounds.top || 0) + 'px';
		this._dom_input.style.left = (this._canvas_bounds.left || 0) + 'px';
		this._dom_input.style.transform = this._pixiMatrixToCSS(this._getDOMRelativeWorldTransform());
		this._dom_input.style.opacity = this.worldAlpha;
		this._setDOMInputVisible(this.worldVisible && this._dom_visible);

		this._previous.canvas_bounds = this._canvas_bounds;
		this._previous.world_transform = this.worldTransform.clone();
		this._previous.world_alpha = this.worldAlpha;
		this._previous.world_visible = this.worldVisible;
	}

	_applyRestriction()
	{
		if (this._restrict_regex.test(this.text))
		{
			this._restrict_value = this.text;
		}
		else
		{
			this.text = this._restrict_value;
			this._dom_input.setSelectionRange(
				this._selection[0],
				this._selection[1]
			);
		}
	}


	// STATE COMPAIRSON (FOR PERFORMANCE BENEFITS)

	_needsUpdate()
	{
		return (
			!this._comparePixiMatrices(this.worldTransform, this._previous.world_transform) ||
			!this._compareClientRects(this._canvas_bounds, this._previous.canvas_bounds) ||
			this.worldAlpha != this._previous.world_alpha ||
			this.worldVisible != this._previous.world_visible
		);
	}

	_needsNewBoxCache()
	{
		let input_bounds = this._getDOMInputBounds();
		return (
			!this._previous.input_bounds ||
			input_bounds.width != this._previous.input_bounds.width ||
			input_bounds.height != this._previous.input_bounds.height
		);
	}


	// INPUT SUBSTITUTION

	_createSurrogate()
	{
		this._surrogate_hitbox = new PIXI.Graphics();
		this._surrogate_hitbox.alpha = 0;
		this._surrogate_hitbox.interactive = true;
		this._surrogate_hitbox.cursor = 'text';
		this._surrogate_hitbox.on('pointerdown', this._onSurrogateFocus.bind(this));
		this.addChild(this._surrogate_hitbox);

		this._surrogate_mask = new PIXI.Graphics();
		this.addChild(this._surrogate_mask);

		this._surrogate = new PIXI.Text('', {});
		this.addChild(this._surrogate);

		this._surrogate.mask = this._surrogate_mask;

		this._updateFontMetrics();
		this._updateSurrogate();
	}

	_updateSurrogate()
	{
		let padding = this._deriveSurrogatePadding();
		let input_bounds = this._getDOMInputBounds();

		this._surrogate.style = this._deriveSurrogateStyle();
		this._surrogate.style.padding = Math.max.apply(Math, padding);
		this._surrogate.y = this._multiline ? padding[0] : (input_bounds.height - this._surrogate.height) / 2;
		this._surrogate.x = padding[3];
		this._surrogate.text = this._deriveSurrogateText();

		switch (this._surrogate.style.align)
		{
			case 'left':
				this._surrogate.x = padding[3];
				break;

			case 'center':
				this._surrogate.x = input_bounds.width * 0.5 - this._surrogate.width * 0.5;
				break;

			case 'right':
				this._surrogate.x = input_bounds.width - padding[1] - this._surrogate.width;
				break;
		}

		this._updateSurrogateHitbox(input_bounds);
		this._updateSurrogateMask(input_bounds, padding);
	}

	_updateSurrogateHitbox(bounds)
	{
		this._surrogate_hitbox.clear();
		this._surrogate_hitbox.beginFill(0);
		this._surrogate_hitbox.drawRect(0, 0, bounds.width, bounds.height);
		this._surrogate_hitbox.endFill();
		this._surrogate_hitbox.interactive = !this._disabled;
	}

	_updateSurrogateMask(bounds, padding)
	{
		this._surrogate_mask.clear();
		this._surrogate_mask.beginFill(0);
		this._surrogate_mask.drawRect(padding[3], 0, bounds.width - padding[3] - padding[1], bounds.height);
		this._surrogate_mask.endFill();
	}

	_destroySurrogate()
	{
		if (!this._surrogate)
		{
			return;
		}

		this.removeChild(this._surrogate);
		this.removeChild(this._surrogate_hitbox);

		this._surrogate.destroy();
		this._surrogate_hitbox.destroy();

		this._surrogate = null;
		this._surrogate_hitbox = null;
	}

	_onSurrogateFocus()
	{
		this._setDOMInputVisible(true);
		//sometimes the input is not being focused by the mouseclick
		setTimeout(this._ensureFocus.bind(this), 10);
	}

	_ensureFocus()
	{
		if (!this._hasFocus())
		{
			this.focus();
		}
	}

	_deriveSurrogateStyle()
	{
		let style = new PIXI.TextStyle();

		for (const key in this._input_style)
		{
			switch (key)
			{
				case 'color':
					style.fill = this._input_style.color;
					break;

				case 'fontFamily':
				case 'fontSize':
				case 'fontWeight':
				case 'fontVariant':
				case 'fontStyle':
					style[key] = this._input_style[key];
					break;

				case 'letterSpacing':
					style.letterSpacing = parseFloat(this._input_style.letterSpacing);
					break;

				case 'textAlign':
					style.align = this._input_style.textAlign;
					break;
			}
		}

		if (this._multiline)
		{
			style.lineHeight = parseFloat(style.fontSize);
			style.wordWrap = true;
			style.wordWrapWidth = this._getDOMInputBounds().width;
		}

		if (this._dom_input.value.length === 0)
		{
			style.fill = this._placeholderColor;
		}

		return style;
	}

	_deriveSurrogatePadding()
	{
		let indent = this._input_style.textIndent ? parseFloat(this._input_style.textIndent) : 0;

		if (this._input_style.padding && this._input_style.padding.length > 0)
		{
			let components = this._input_style.padding.trim().split(' ');

			if (components.length == 1)
			{
				let padding = parseFloat(components[0]);
				return [padding, padding, padding, padding + indent];
			}
			else if (components.length == 2)
			{
				let paddingV = parseFloat(components[0]);
				let paddingH = parseFloat(components[1]);
				return [paddingV, paddingH, paddingV, paddingH + indent];
			}
			else if (components.length == 4)
			{
				let padding = components.map(component =>
				{
					return parseFloat(component);
				});
				padding[3] += indent;
				return padding;
			}
		}

		return [0, 0, 0, indent];
	}

	_deriveSurrogateText()
	{
		return this._dom_input.value.length === 0 ? this._placeholder : this._dom_input.value;
	}

	_updateFontMetrics()
	{
		const style = this._deriveSurrogateStyle();
		const font = style.toFontString();

		this._font_metrics = PIXI.TextMetrics.measureFont(font);
	}


	// CACHING OF INPUT BOX GRAPHICS

	_buildBoxCache()
	{
		this._destroyBoxCache();

		let states = ['DEFAULT', 'FOCUSED', 'DISABLED'];
		let input_bounds = this._getDOMInputBounds();

		for (let i in states)
		{
			this._box_cache[states[i]] = this._box_generator(
				input_bounds.width,
				input_bounds.height,
				states[i]
			);
		}

		this._previous.input_bounds = input_bounds;
	}

	_destroyBoxCache()
	{
		if (this._box)
		{
			this.removeChild(this._box);
			this._box = null;
		}

		for (let i in this._box_cache)
		{
			this._box_cache[i].destroy();
			this._box_cache[i] = null;
			delete this._box_cache[i];
		}
	}


	// HELPER FUNCTIONS

	_hasFocus()
	{
		return document.activeElement === this._dom_input;
	}

	_setDOMInputVisible(visible)
	{
		this._dom_input.style.display = visible ? 'block' : 'none';
	}

	_getCanvasBounds()
	{
		let rect = this._last_renderer.view.getBoundingClientRect();
		let bounds = {top: rect.top, left: rect.left, width: rect.width, height: rect.height};
		bounds.left += window.scrollX;
		bounds.top += window.scrollY;
		return bounds;
	}

	_getDOMInputBounds()
	{
		let remove_after = false;

		if (!this._dom_added)
		{
			document.body.appendChild(this._dom_input);
			remove_after = true;
		}

		let org_transform = this._dom_input.style.transform;
		let org_display = this._dom_input.style.display;
		this._dom_input.style.transform = '';
		this._dom_input.style.display = 'block';
		let bounds = this._dom_input.getBoundingClientRect();
		this._dom_input.style.transform = org_transform;
		this._dom_input.style.display = org_display;

		if (remove_after)
		{
			document.body.removeChild(this._dom_input);
		}

		return bounds;
	}

	_getDOMRelativeWorldTransform()
	{
		let canvas_bounds = this._last_renderer.view.getBoundingClientRect();
		let matrix = this.worldTransform.clone();

		matrix.scale(this._resolution, this._resolution);
		matrix.scale(canvas_bounds.width / this._last_renderer.width,
			canvas_bounds.height / this._last_renderer.height);
		return matrix;
	}

	_pixiMatrixToCSS(m)
	{
		return 'matrix(' + [m.a, m.b, m.c, m.d, m.tx, m.ty].join(',') + ')';
	}

	_comparePixiMatrices(m1, m2)
	{
		if (!m1 || !m2)
		{
			return false;
		}
		return (
			m1.a == m2.a &&
			m1.b == m2.b &&
			m1.c == m2.c &&
			m1.d == m2.d &&
			m1.tx == m2.tx &&
			m1.ty == m2.ty
		);
	}

	_compareClientRects(r1, r2)
	{
		if (!r1 || !r2)
		{
			return false;
		}
		return (
			r1.left == r2.left &&
			r1.top == r2.top &&
			r1.width == r2.width &&
			r1.height == r2.height
		);
	}


}


function DefaultBoxGenerator(styles)
{
	styles = styles || {fill: 0xcccccc};

	if (styles.default)
	{
		styles.focused = styles.focused || styles.default;
		styles.disabled = styles.disabled || styles.default;
	}
	else
	{
		let temp_styles = styles;
		styles = {};
		styles.default = styles.focused = styles.disabled = temp_styles;
	}

	return function (w, h, state)
	{
		let style = styles[state.toLowerCase()];
		let box = new PIXI.Graphics();

		if (style.fill)
		{
			box.beginFill(style.fill);
		}

		if (style.stroke)
		{
			box.lineStyle(
				style.stroke.width || 1,
				style.stroke.color || 0,
				style.stroke.alpha || 1
			);
		}

		if (style.rounded)
		{
			box.drawRoundedRect(0, 0, w, h, style.rounded);
		}
		else
		{
			box.drawRect(0, 0, w, h);
		}

		box.endFill();
		box.closePath();

		return box;
	};
}
