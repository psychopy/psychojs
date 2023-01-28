/**
 * Grating Stimulus.
 *
 * @author Nikita Agafonov
 * @version 2022.3.0
 * @copyright (c) 2020-2023 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";

const DEFAULT_POOL_SIZE = 1024;
const DEFAULT_PARTICLE_WIDTH = 10;
const DEFAULT_PARTICLE_HEIGHT = 10;
const DEFAULT_PARTICLE_LIFETIME = 3; // ms
const DEFAULT_PARTICLE_COLOR = 0xffffff;
const DEFAULT_PARTICLES_PER_SEC = 60;
const DEFAULT_PARTICLE_ACCELERATION = 2500;

class Particle
{
	constructor (cfg)
	{
		this.x = 0;
		this.y = 0;
		this.ax = 0;
		this.ay = 0;
		this.vx = 0;
		this.vy = 0;
		this.lifeTime = 0;
		this.widthChange = 0;
		this.heightChange = 0;
		this.sprite = undefined;
		this.inUse = false;

		if (cfg.particleImage !== undefined)
		{
			this.sprite = PIXI.Sprite.from(PIXI.Texture.from(cfg.particleImage));
		}
		else
		{
			this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
			this.sprite.tint = cfg.particleColor || DEFAULT_PARTICLE_COLOR;
		}

		// TODO: Should we instead incorporate that in position calculation?
		// Consider: accurate spawn position of the particle confined by spawnArea.
		this.sprite.anchor.set(0.5);

		this.width = cfg.width || DEFAULT_PARTICLE_WIDTH;
		this.height = cfg.height || DEFAULT_PARTICLE_HEIGHT;
	}

	set width (w)
	{
		this._width = w;
		this.sprite.width = w;
	}

	get width ()
	{
		return this._width;
	}

	set height (h)
	{
		this._height = h;
		this.sprite.height = h;
	}

	get height ()
	{
		return this._height;
	}

	update (dt)
	{
		const dt2 = dt ** 2;

		// Update position with current velocity.
		this.x = this.x + this.vx * dt + this.ax * dt2 * .5;
		this.y = this.y + this.vy * dt + this.ay * dt2 * .5;

		// Update velocity with current acceleration.
		this.vx = this.ax * dt;
		this.vy = this.ay * dt;

		this.sprite.x = this.x;
		this.sprite.y = this.y;

		if (this.width > 0)
		{
			this.width = Math.max(0, this.width + this.widthChange);
		}

		if (this.height > 0)
		{
			this.height = Math.max(0, this.height + this.heightChange);
		}
		this.lifeTime -= dt;

		if (this.width <= 0 && this.height <= 0)
		{
			this.lifeTime = 0;
		}

		if (this.lifeTime <= 0)
		{
			this.inUse = false;
		}
	}
}

export class ParticleSystem
{
	constructor (cfg = {})
	{
		this.x = 0;
		this.y = 0;
		this._cfg = cfg;
		this._particlesPerSec = cfg.particlesPerSec || DEFAULT_PARTICLES_PER_SEC;
		this._spawnCoolDown = 0;
		this._parentObj = undefined;
		this._particlePool = new Array(DEFAULT_POOL_SIZE);

		if (cfg.parentObject !== undefined)
		{
			this._parentObj = cfg.parentObject;
		}

		this._fillParticlePool(cfg);
	}

	_fillParticlePool (cfg)
	{
		let i;
		for (i = 0; i < this._particlePool.length; i++)
		{
			this._particlePool[i] = new Particle(cfg);
		}
	}

	_setupParticle (p)
	{
		let spawnAreaWidth = this._cfg.spawnAreaWidth || 0;
		let spawnAreaHeight = this._cfg.spawnAreaHeight || 0;

		if (this._parentObj !== undefined && this._cfg.useParentSizeAsSpawnArea)
		{
			spawnAreaWidth = this._parentObj.width;
			spawnAreaHeight = this._parentObj.height;
		}

		const spawnOffsetX = Math.random() * spawnAreaWidth - spawnAreaWidth * .5;
		const spawnOffsetY = Math.random() * spawnAreaHeight - spawnAreaHeight * .5;
		const x = this.x + spawnOffsetX;
		const y = this.y + spawnOffsetY;

		p.x = x;
		p.y = y;

		p.ax = this._cfg.initialAx || Math.random() * DEFAULT_PARTICLE_ACCELERATION * 2.0 - DEFAULT_PARTICLE_ACCELERATION;
		p.ay = this._cfg.initialAy || Math.random() * DEFAULT_PARTICLE_ACCELERATION * 2.0 - DEFAULT_PARTICLE_ACCELERATION;
		p.vx = this._cfg.initialVx || 0;
		p.vy = this._cfg.initialVy || 0;
		p.lifeTime = this._cfg.lifeTime || DEFAULT_PARTICLE_LIFETIME;
		p.width = this._cfg.width || DEFAULT_PARTICLE_WIDTH;
		p.height = this._cfg.height || DEFAULT_PARTICLE_HEIGHT;
		p.widthChange = this._cfg.widthChange || 0;
		p.heightChange = this._cfg.heightChange || 0;

		if (this._cfg.particleColor !== undefined)
		{
			p.sprite.tint = this._cfg.particleColor;
		}
		else
		{
			p.sprite.tint = 0xffffff;
		}
	}

	_spawnParticles (n = 0)
	{
		let i;
		for (i = 0; i < this._particlePool.length && n > 0; i++)
		{
			if (this._particlePool[i].inUse === false)
			{
				this._particlePool[i].inUse = true;
				n--;

				this._setupParticle(this._particlePool[i]);
				this._cfg.container.addChild(this._particlePool[i].sprite);
			}
		}
	}

	update (dt)
	{
		// Sync with parent object if it exists.
		if (this._parentObj !== undefined)
		{
			this.x = this._parentObj.x;
			this.y = this._parentObj.y;
		}

		if (this._spawnCoolDown <= 0)
		{
			this._spawnCoolDown = 1 / this._particlesPerSec;

			// Assuming that we have at least 60FPS.
			const frameTime = Math.min(dt, 1 / 60);
			const particlesPerFrame = Math.ceil(frameTime / this._spawnCoolDown);

			// TODO: figure out how to calc amount of particles when it's more than 1 per frame.
			this._spawnParticles(particlesPerFrame);
		}
		else
		{
			this._spawnCoolDown -= dt;
		}

		let i;
		for (i = 0; i < this._particlePool.length; i++)
		{
			if (this._particlePool[i].inUse)
			{
				this._particlePool[i].update(dt);
			}

			// Check if particle should be removed.
			if (this._particlePool[i].lifeTime <= 0 && this._particlePool[i].sprite.parent)
			{
				this._cfg.container.removeChild(this._particlePool[i].sprite);
			}
		}
	}
}
