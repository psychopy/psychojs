/**
 * Particle Emitter.
 *
 * @author Nikita Agafonov
 * @version 2023.2.0
 * @copyright (c) 2020-2023 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";

const DEFAULT_POOL_SIZE = 1024;
const DEFAULT_PARTICLE_WIDTH = 10;
const DEFAULT_PARTICLE_HEIGHT = 10;
const DEFAULT_PARTICLE_LIFETIME = 3; // Seconds.
const DEFAULT_PARTICLE_COLOR = 0xffffff;
const DEFAULT_PARTICLES_PER_SEC = 60;
const DEFAULT_PARTICLE_V = 100;

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

		this.width = cfg.particleWidth || DEFAULT_PARTICLE_WIDTH;
		this.height = cfg.particleHeight || DEFAULT_PARTICLE_HEIGHT;
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
		const dt2 = dt * dt;

		// Update velocity with current acceleration.
		this.vx += this.ax * dt;
		this.vy += this.ay * dt;

		// Update position with current velocity and acceleration.
		this.x = this.x + this.vx * dt + this.ax * dt2 * .5;
		this.y = this.y + this.vy * dt + this.ay * dt2 * .5;

		this.sprite.rotation = Math.atan2(this.vy, this.vx);

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

export class ParticleEmitter
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
		this.setParentObject(cfg.parentObject);
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

		p.ax = 0;
		p.ay = 0;

		if (Number.isFinite(this._cfg.initialVx))
		{
			p.vx = this._cfg.initialVx;
		}
		else if (this._cfg.initialVx instanceof Array && this._cfg.initialVx.length >= 2)
		{
			p.vx = Math.random() * (this._cfg.initialVx[1] - this._cfg.initialVx[0]) + this._cfg.initialVx[0];
		}
		else
		{
			p.vx = Math.random() * DEFAULT_PARTICLE_V - DEFAULT_PARTICLE_V * .5;
		}

		if (Number.isFinite(this._cfg.initialVy))
		{
			p.vy = this._cfg.initialVy;
		}
		else if (this._cfg.initialVy instanceof Array && this._cfg.initialVy.length >= 2)
		{
			p.vy = Math.random() * (this._cfg.initialVy[1] - this._cfg.initialVy[0]) + this._cfg.initialVy[0];
		}
		else
		{
			p.vy = Math.random() * DEFAULT_PARTICLE_V - DEFAULT_PARTICLE_V * .5;
		}

		p.lifeTime = this._cfg.lifeTime || DEFAULT_PARTICLE_LIFETIME;
		p.width = this._cfg.particleWidth || DEFAULT_PARTICLE_WIDTH;
		p.height = this._cfg.particleHeight || DEFAULT_PARTICLE_HEIGHT;
		p.widthChange = this._cfg.particleWidthChange || 0;
		p.heightChange = this._cfg.particleHeightChange || 0;

		// TODO: run proper checks here.
		if (this._cfg.particleImage)
		{
			p.sprite.texture = PIXI.Texture.from(this._cfg.particleImage);
		}
		else
		{
			p.sprite.texture = PIXI.Texture.WHITE;
		}

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

	_getResultingExternalForce ()
	{
		let externalForce = [0, 0];
		if (this._cfg.externalForces instanceof Array)
		{
			let i;
			for (i = 0; i < this._cfg.externalForces.length; i++)
			{
				externalForce[0] += this._cfg.externalForces[i][0];
				externalForce[1] += this._cfg.externalForces[i][1];
			}
		}

		return externalForce;
	}

	setParentObject (po)
	{
		this._parentObj = po;
	}

	/**
	 * @desc: Adds external force which acts on a particle
	 * @param: f - Array with two elements, first is x component, second is y component.
	 * It's a vector of length L which sets the direction and the margnitude of the force.
	 * */
	addExternalForce (f)
	{
		this._cfg.externalForces.push(f);
	}

	removeExternalForce (f)
	{
		const i = this._cfg.externalForces.indexOf(f);
		if (i !== -1)
		{
			this._cfg.externalForces.splice(i, 1);
		}
	}

	removeExternalForceByIdx (idx)
	{
		if (this._cfg.externalForces[idx] !== undefined)
		{
			this._cfg.externalForces.splice(idx, 1);
		}
	}

	update (dt)
	{
		let externalForce;

		// Sync with parent object if it exists.
		if (this._parentObj !== undefined)
		{
			this.x = this._parentObj.x;
			this.y = this._parentObj.y;
		}

		if (Number.isFinite(this._cfg.positionOffsetX))
		{
			this.x += this._cfg.positionOffsetX;
		}

		if (Number.isFinite(this._cfg.positionOffsetY))
		{
			this.y += this._cfg.positionOffsetY;
		}

		if (this._spawnCoolDown <= 0)
		{
			this._spawnCoolDown = 1 / this._particlesPerSec;

			// Assuming that we have at least 60FPS.
			const frameTime = Math.min(dt, 1 / 60);
			const particlesPerFrame = Math.ceil(frameTime / this._spawnCoolDown);
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
				externalForce = this._getResultingExternalForce();
				this._particlePool[i].ax = externalForce[0];
				this._particlePool[i].ay = externalForce[1];
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
