/**
 * Manager handling the detecting of faces in video streams.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {PsychoJS} from "../core/PsychoJS.js";
import * as util from "../util/Util.js";
import { to_pixiPoint } from "../util/Pixi.js";
import {Color} from "../util/Color.js";
import {Camera} from "../hardware/Camera.js";
import {VisualStim} from "./VisualStim.js";
import * as PIXI from "pixi.js-legacy";


/**
 * <p>This manager handles the detecting of faces in video streams. FaceDetector relies on the
 * [Face-API library]{@link https://github.com/justadudewhohacks/face-api.js} developed by
 * [Vincent Muehler]{@link https://github.com/justadudewhohacks}.</p>
 *
 * @extends VisualStim
 */
export class FaceDetector extends VisualStim
{
	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from the detector
	 * @param {module:core.Window} options.win - the associated Window
	 * @param {string | HTMLVideoElement | module:visual.Camera} options.input - the name of a
	 * 	movie resource or of a HTMLVideoElement or of a Camera component
	 * @param {string} [options.faceApiUrl= 'face-api.js'] - the Url of the face-api library
	 * @param {string} [options.modelDir= 'models'] - the directory where to find the face detection models
	 * @param {string} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
	 * @param {string} [options.units= 'norm'] - the units of the stimulus vertices, size and position
	 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
	 * @param {number} [options.size] - the size of the rendered image (the size of the image will be used if size is not specified)
	 * @param {number} [options.opacity= 1.0] - the opacity
	 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether or not to log
	 */
	constructor({name, win, input, modelDir, faceApiUrl, units, ori, opacity, pos, size, autoDraw, autoLog} = {})
	{
		super({name, win, units, ori, opacity, pos, size, autoDraw, autoLog});

		// TODO deal with onChange (see MovieStim and Camera)
		this._addAttribute("input", input, undefined);
		this._addAttribute("faceApiUrl", faceApiUrl, "face-api.js");
		this._addAttribute("modelDir", modelDir, "models");
		this._addAttribute("autoLog", autoLog, false);
		this._addAttribute("status", PsychoJS.Status.NOT_STARTED);

		// init face-api:
		this._initFaceApi();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	/**
	 * Query whether or not the face detector is ready to detect.
	 *
	 * @returns {boolean} whether or not the face detector is ready to detect
	 */
	isReady()
	{
		return this._modelsLoaded;
	}

	/**
	 * Setter for the video attribute.
	 *
	 * @param {string | HTMLVideoElement | module:visual.Camera} input - the name of a
	 * movie resource or a HTMLVideoElement or a Camera component
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setInput(input, log = false)
	{
		const response = {
			origin: "FaceDetector.setInput",
			context: "when setting the video of FaceDetector: " + this._name
		};

		try
		{
			// movie is undefined: that's fine but we raise a warning in case this is
			// a symptom of an actual problem
			if (typeof input === "undefined")
			{
				this.psychoJS.logger.warn("setting the movie of MovieStim: " + this._name + " with argument: undefined.");
				this.psychoJS.logger.debug("set the movie of MovieStim: " + this._name + " as: undefined");
			}
			else
			{
				// if movie is a string, then it should be the name of a resource, which we get:
				if (typeof input === "string")
				{
					// TODO create a movie with that resource, and use the movie as input
				}

				// if movie is an instance of camera, get a video element from it:
				else if (input instanceof Camera)
				{
					const video = input.getVideo();
					// TODO remove previous one if there is one
					// document.body.appendChild(video);
					input = video;
				}

				// check that video is now an HTMLVideoElement
				if (!(input instanceof HTMLVideoElement))
				{
					throw input.toString() + " is not a video";
				}

				this.psychoJS.logger.debug(`set the video of FaceDetector: ${this._name} as: src= ${input.src}, size= ${input.videoWidth}x${input.videoHeight}, duration= ${input.duration}s`);

				// ensure we have only one onended listener per HTMLVideoElement, since we can have several
				// MovieStim with the same underlying HTMLVideoElement
				// https://stackoverflow.com/questions/11455515
				if (!input.onended)
				{
					input.onended = () =>
					{
						this.status = PsychoJS.Status.FINISHED;
					};
				}
			}

			this._setAttribute("input", input, log);
			this._needUpdate = true;
			this._needPixiUpdate = true;
		}
		catch (error)
		{
			throw Object.assign(response, {error});
		}
	}


	/**
	 * Start detecting faces.
	 *
	 * @param {number} period - the detection period, in ms (e.g. 100 ms for 10Hz)
	 * @param detectionCallback - the callback triggered when detection results are available
	 * @param {boolean} [log= false] - whether of not to log
	 */
	start(period, detectionCallback, log = false)
	{
		this.status = PsychoJS.Status.STARTED;

		if (typeof this._detectionId !== "undefined")
		{
			clearInterval(this._detectionId);
			this._detectionId = undefined;
		}

		this._detectionId = setInterval(
			async () =>
			{
				this._detections = await faceapi.detectAllFaces(
					this._input,
					new faceapi.TinyFaceDetectorOptions()
				)
				.withFaceLandmarks()
				.withFaceExpressions();

				this._needUpdate = true;
				this._needPixiUpdate = true;

				detectionCallback(this._detections);
			},
			period);
	}

	/**
	 * Stop detecting faces.
	 *
	 * @param {boolean} [log= false] - whether of not to log
	 */
	stop(log = false)
	{
		this.status = PsychoJS.Status.NOT_STARTED;

		if (typeof this._detectionId !== "undefined")
		{
			clearInterval(this._detectionId);
			this._detectionId = undefined;
		}
	}

	/**
	 * Init the Face-API library.
	 *
	 * @protected
	 */
	async _initFaceApi()
	{
/*
		// load the library:
		await this._psychoJS.serverManager.prepareResources([
			{
				"name": "face-api.js",
				"path": this.faceApiUrl,
				"download": true
			}
		]);
*/

		// load the models:
		this._modelsLoaded = false;
		await faceapi.nets.tinyFaceDetector.loadFromUri(this._modelDir);
		await faceapi.nets.faceLandmark68Net.loadFromUri(this._modelDir);
		await faceapi.nets.faceRecognitionNet.loadFromUri(this._modelDir);
		await faceapi.nets.faceExpressionNet.loadFromUri(this._modelDir);
		this._modelsLoaded = true;
	}

	/**
	 * Update the visual representation of the detected faces, if necessary.
	 *
	 * @protected
	 */
	_updateIfNeeded()
	{
		if (!this._needUpdate)
		{
			return;
		}
		this._needUpdate = false;

		if (this._needPixiUpdate)
		{
			this._needPixiUpdate = false;

			if (typeof this._pixi !== "undefined")
			{
				this._pixi.destroy(true);
			}
			this._pixi = new PIXI.Container();
			this._pixi.interactive = true;

			this._body = new PIXI.Graphics();
			this._body.interactive = true;
			this._pixi.addChild(this._body);

			const size_px = util.to_px(this.size, this.units, this.win);
			if (typeof this._detections !== "undefined")
			{
				for (const detection of this._detections)
				{
					const landmarks = detection.landmarks;
					const imageWidth = detection.alignedRect.imageWidth;
					const imageHeight = detection.alignedRect.imageHeight;

					for (const position of landmarks.positions)
					{
						this._body.beginFill(new Color("red").int, this._opacity);
						this._body.drawCircle(
							position._x / imageWidth * size_px[0] - size_px[0] / 2,
							position._y / imageHeight * size_px[1] - size_px[1] / 2,
							2);
						this._body.endFill();
					}
				}
			}

		}


		this._pixi.scale.x = 1;
		this._pixi.scale.y = -1;

		this._pixi.rotation = -this.ori * Math.PI / 180;
		this._pixi.position = to_pixiPoint(this.pos, this.units, this.win);

		this._pixi.alpha = this._opacity;
	}

	/**
	 * Estimate the bounding box.
	 *
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		// TODO
	}

}


