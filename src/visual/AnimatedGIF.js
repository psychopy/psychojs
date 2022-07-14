// import { Sprite } from '@pixi/sprite';
// import { Texture, Renderer } from '@pixi/core';
// import { settings } from '@pixi/settings';
// import { SCALE_MODES } from '@pixi/constants';
// import { Ticker, UPDATE_PRIORITY } from '@pixi/ticker';

import * as PIXI from "pixi.js-legacy";

/**
 * Represents a single frame of a GIF. Includes image and timing data.
 * @memberof PIXI.gif
 */
// interface FrameObject {
//     // Image data for the current frame
//     imageData: ImageData;
//     // The start of the current frame, in milliseconds
//     start: number;
//     // The end of the current frame, in milliseconds
//     end: number;
// }

/**
 * Default options for all AnimatedGIF objects.
 * @memberof PIXI.gif
 */
// interface AnimatedGIFOptions {
//     // Whether to start playing right away
//     autoPlay: boolean;
//     /**
//      * Scale Mode to use for the texture
//      * @type {PIXI.SCALE_MODES}
//      */
//     scaleMode: SCALE_MODES;
//     // To enable looping
//     loop: boolean;
//     // Speed of the animation
//     animationSpeed: number;
//     // Set to `false` to manage updates yourself
//     autoUpdate: boolean;
//     // The completed callback, optional
//     onComplete: () => void;
//     // The loop callback, optional
//     onLoop: () => void;
//     // The frame callback, optional
//     onFrameChange: (currentFrame: number) => void;
//     // Fallback FPS if GIF contains no time information
//     fps?: number;
// }

/**
 * Options for the AnimatedGIF constructor.
 * @memberof PIXI.gif
 */
// interface AnimatedGIFSize {
//     /** Width of the GIF image */
//     width: number;
//     /** Height of the GIF image */
//     height: number;
// }

/**
 * Runtime object to play animated GIFs. This object is similar to an AnimatedSprite.
 * It support playback (seek, play, stop) as well as animation speed and looping.
 */
class AnimatedGIF extends PIXI.Sprite
{
    /**
     * Default options for all AnimatedGIF objects.
     * @property {PIXI.SCALE_MODES} [scaleMode=PIXI.SCALE_MODES.LINEAR] - Scale mode to use for the texture.
     * @property {boolean} [loop=true] - To enable looping.
     * @property {number} [animationSpeed=1] - Speed of the animation.
     * @property {boolean} [autoUpdate=true] - Set to `false` to manage updates yourself.
     * @property {boolean} [autoPlay=true] - To start playing right away.
     * @property {Function} [onComplete=null] - The completed callback, optional.
     * @property {Function} [onLoop=null] - The loop callback, optional.
     * @property {Function} [onFrameChange=null] - The frame callback, optional.
     * @property {number} [fps=PIXI.Ticker.shared.FPS] - Default FPS.
     */
    static defaultOptions = {
        scaleMode: PIXI.SCALE_MODES.LINEAR,
        fps: PIXI.Ticker.shared.FPS,
        loop: true,
        animationSpeed: 1,
        autoPlay: true,
        autoUpdate: true,
        onComplete: null,
        onFrameChange: null,
        onLoop: null
    };

    /**
     * Create an animated GIF animation from a GIF image's ArrayBuffer. The easiest way to get
     * the buffer is to use the Loader.
     * @example
     * const loader = new PIXI.Loader();
     * loader.add('myFile', 'file.gif');
     * loader.load((loader, resources) => {
     *    const gif = resources.myFile.animation;
     *    // add to the stage...
     * });
     * @param buffer - GIF image arraybuffer from loader.
     * @param options - Options to use.
     * @returns
     */
    // static fromBuffer(buffer, options)
    // {
    //     if (!buffer || buffer.byteLength === 0)
    //     {
    //         throw new Error('Invalid buffer');
    //     }

    //     // fix https://github.com/matt-way/gifuct-js/issues/30
    //     const validateAndFix = (gif) =>
    //     {
    //         let currentGce = null;

    //         for (const frame of gif.frames)
    //         {
    //             currentGce = frame.gce ?? currentGce;

    //             // fix loosing graphic control extension for same frames
    //             if ('image' in frame && !('gce' in frame))
    //             {
    //                 frame.gce = currentGce;
    //             }
    //         }
    //     };

    //     const gif = parseGIF(buffer);

    //     validateAndFix(gif);
    //     const gifFrames = decompressFrames(gif, true);
    //     const frames: FrameObject[] = [];

    //     // Temporary canvases required for compositing frames
    //     const canvas = document.createElement('canvas');
    //     const context = canvas.getContext('2d');
    //     const patchCanvas = document.createElement('canvas');
    //     const patchContext = patchCanvas.getContext('2d');

    //     canvas.width = gif.lsd.width;
    //     canvas.height = gif.lsd.height;

    //     let time = 0;

    //     // Some GIFs have a non-zero frame delay, so we need to calculate the fallback
    //     const { fps } = Object.assign({}, AnimatedGIF.defaultOptions, options);
    //     const defaultDelay = 1000 / fps;

    //     // Precompute each frame and store as ImageData
    //     for (let i = 0; i < gifFrames.length; i++)
    //     {
    //         // Some GIF's omit the disposalType, so let's assume clear if missing
    //         const { disposalType = 2, delay = defaultDelay, patch, dims: { width, height, left, top } } = gifFrames[i];

    //         patchCanvas.width = width;
    //         patchCanvas.height = height;
    //         patchContext.clearRect(0, 0, width, height);
    //         const patchData = patchContext.createImageData(width, height);

    //         patchData.data.set(patch);
    //         patchContext.putImageData(patchData, 0, 0);

    //         context.drawImage(patchCanvas, left, top);
    //         const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    //         if (disposalType === 2 || disposalType === 3)
    //         {
    //             context.clearRect(0, 0, canvas.width, canvas.height);
    //         }

    //         frames.push({
    //             start: time,
    //             end: time + delay,
    //             imageData,
    //         });
    //         time += delay;
    //     }

    //     // clear the canvases
    //     canvas.width = canvas.height = 0;
    //     patchCanvas.width = patchCanvas.height = 0;
    //     const { width, height } = gif.lsd;

    //     return new AnimatedGIF(frames, { width, height, ...options });
    // }

    /**
     * @param frames - Data of the GIF image.
     * @param options - Options for the AnimatedGIF
     */
    // constructor(frames, options)
    constructor(decompressedFrames, options)
    {
        // Get the options, apply defaults
        const { scaleMode, width, height, ...rest } = Object.assign({},
            AnimatedGIF.defaultOptions,
            options
        );

        // Create the texture
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;

        super(PIXI.Texture.from(canvas, { scaleMode }));

        // this.duration = frames[frames.length - 1].end;
        // this._frames = frames;
        this._frameData = decompressedFrames;
        this._origDims = { width, height };
        this._frameTimings = new Array(decompressedFrames.length);
        this._framePixels = new Array(decompressedFrames.length);
        let i, j, time = 0;
        let t = performance.now();
        // let i = this._currentFrame;
        let patchRow = 0, patchCol = 0;
        let offset = 0;
        let colorData;
        let pixelData = new Uint8ClampedArray(width * height * 4);
        let fullPixelData = new Uint8ClampedArray(width * height * 4 * decompressedFrames.length);
        for (i = 0; i < decompressedFrames.length; i++)
        {
            for (j = 0; j < this._frameData[i].pixels.length; j++)
            {
                colorData = this._frameData[i].colorTable[this._frameData[i].pixels[j]];
                if (frames[i].pixels[j] !== frames[i].transparentIndex)
                {
                    patchRow = (j / frames[i].dims.width) | 0;
                    offset = (this._origDims.width * (frames[i].dims.top + patchRow) + frames[i].dims.left) * 4;
                    patchCol = (j % frames[i].dims.width) * 4;
                    pixelData[offset + patchCol] = colorData[0];
                    pixelData[offset + patchCol + 1] = colorData[1];
                    pixelData[offset + patchCol + 2] = colorData[2];
                    pixelData[offset + patchCol + 3] = 255;
                }
            }
            // this._framePixels[i] = new Uint8ClampedArray(pixelData);
            fullPixelData.set(pixelData, pixelData.length * i);
            this._frameTimings[i] =
            {
                start: time,
                end: time + decompressedFrames[i].delay
            };
            time += decompressedFrames[i].delay;
        }
        this._fullPixelData = fullPixelData;
        this.duration = this._frameTimings[decompressedFrames.length - 1].end;
        // this._frameImageData = new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
        this._frameImageDataCache = [];
        this._context = context;
        this._playing = false;
        this._currentTime = 0;
        this._isConnectedToTicker = false;
        Object.assign(this, rest);

        // Draw the first frame
        this.currentFrame = 0;
        if (this.autoPlay)
        {
            this.play();
        }
    }

    /** Stops the animation. */
    stop()
    {
        if (!this._playing)
        {
            return;
        }

        this._playing = false;
        if (this._autoUpdate && this._isConnectedToTicker)
        {
            PIXI.Ticker.shared.remove(this.update, this);
            this._isConnectedToTicker = false;
        }
    }

    /** Plays the animation. */
    play()
    {
        if (this._playing)
        {
            return;
        }

        this._playing = true;
        if (this._autoUpdate && !this._isConnectedToTicker)
        {
            PIXI.Ticker.shared.add(this.update, this, PIXI.UPDATE_PRIORITY.HIGH);
            this._isConnectedToTicker = true;
        }

        // If were on the last frame and stopped, play should resume from beginning
        if (!this.loop && this.currentFrame === this._frameData.length - 1)
        {
            this._currentTime = 0;
        }
    }

    /**
     * Get the current progress of the animation from 0 to 1.
     * @readonly
     */
    get progress()
    {
        return this._currentTime / this.duration;
    }

    /** `true` if the current animation is playing */
    get playing()
    {
        return this._playing;
    }

    /**
     * Updates the object transform for rendering. You only need to call this
     * if the `autoUpdate` property is set to `false`.
     *
     * @param deltaTime - Time since last tick.
     */
    update(deltaTime)
    {
        if (!this._playing)
        {
            return;
        }

        const elapsed = this.animationSpeed * deltaTime / PIXI.settings.TARGET_FPMS;
        const currentTime = this._currentTime + elapsed;
        const localTime = currentTime % this.duration;

        const localFrame = this._frameTimings.findIndex((ft) =>
            ft.start <= localTime && ft.end > localTime);

        if (currentTime >= this.duration)
        {
            if (this.loop)
            {
                this._currentTime = localTime;
                this.updateFrameIndex(localFrame);
                if (typeof this.onLoop === "function")
                {
                    this.onLoop();
                }
            }
            else
            {
                this._currentTime = this.duration;
                this.updateFrameIndex(this._frameData.length - 1);
                if (typeof this.onComplete === "function")
                {
                    this.onComplete();
                }
                this.stop();
            }
        }
        else
        {
            this._currentTime = localTime;
            this.updateFrameIndex(localFrame);
        }
    }

    /**
     * Redraw the current frame, is necessary for the animation to work when
     */
    updateFrame()
    {
        if (!this.dirty)
        {
            return;
        }

        // let t = performance.now();
        // let i = this._currentFrame;
        // let j = 0;
        // let patchRow = 0, patchCol = 0;
        // let offset = 0;
        // let colorData;
        // for (j = 0; j < this._frameData[i].pixels.length; j++) {
        //     colorData = this._frameData[i].colorTable[this._frameData[i].pixels[j]];
        //     if (frames[i].pixels[j] !== frames[i].transparentIndex) {
        //         patchRow = (j / frames[i].dims.width) | 0;
        //         offset = (this._origDims.width * (frames[i].dims.top + patchRow) + frames[i].dims.left) * 4;
        //         patchCol = (j % frames[i].dims.width) * 4;
        //         this._frameImageData.data[offset + patchCol] = colorData[0];
        //         this._frameImageData.data[offset + patchCol + 1] = colorData[1];
        //         this._frameImageData.data[offset + patchCol + 2] = colorData[2];
        //         this._frameImageData.data[offset + patchCol + 3] = 255;
        //     }
        // }

        // Update the current frame
        // const { imageData } = this._frames[this._currentFrame];
        // this._context.putImageData(imageData, 0, 0);
        let imageData = this._frameImageDataCache[this._currentFrame];
        if (imageData === undefined)
        {
            let t = performance.now();
            let frameLen = this._origDims.width * this._origDims.height * 4;
            imageData = new ImageData(new Uint8ClampedArray(this._fullPixelData.buffer, frameLen * this._currentFrame, frameLen), this._origDims.width, this._origDims.height);
            this._frameImageDataCache[this._currentFrame] = imageData;
            console.log("frame id construction took", performance.now() - t);
        }
        this._context.putImageData(imageData, 0, 0);

        // Workaround hack for Safari & iOS
        // which fails to upload canvas after putImageData
        // See: https://bugs.webkit.org/show_bug.cgi?id=229986
        this._context.fillStyle = "transparent";
        this._context.fillRect(0, 0, 0, 1);

        this.texture.update();

        // Mark as clean
        this.dirty = false;
    }

    /**
     * Renders the object using the WebGL renderer
     *
     * @param {PIXI.Renderer} renderer - The renderer
     * @private
     */
    _render(renderer)
    {
        this.updateFrame();
        super._render(renderer);
    }

    /**
     * Renders the object using the WebGL renderer
     *
     * @param {PIXI.CanvasRenderer} renderer - The renderer
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    _renderCanvas(renderer)
    {
        this.updateFrame();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        super._renderCanvas(renderer);
    }

    /**
     * Whether to use PIXI.Ticker.shared to auto update animation time.
     * @default true
     */
    get autoUpdate()
    {
        return this._autoUpdate;
    }

    set autoUpdate(value)
    {
        if (value !== this._autoUpdate)
        {
            this._autoUpdate = value;

            if (!this._autoUpdate && this._isConnectedToTicker)
            {
                PIXI.Ticker.shared.remove(this.update, this);
                this._isConnectedToTicker = false;
            }
            else if (this._autoUpdate && !this._isConnectedToTicker && this._playing)
            {
                PIXI.Ticker.shared.add(this.update, this);
                this._isConnectedToTicker = true;
            }
        }
    }

    /** Set the current frame number */
    get currentFrame()
    {
        return this._currentFrame;
    }

    set currentFrame(value)
    {
        this.updateFrameIndex(value);
        this._currentTime = this._frameTimings[value].start;
    }

    /** Internally handle updating the frame index */
    updateFrameIndex(value)
    {
        if (value < 0 || value >= this._frameData.length)
        {
            throw new Error(`Frame index out of range, expecting 0 to ${this.totalFrames}, got ${value}`);
        }
        if (this._currentFrame !== value)
        {
            this._currentFrame = value;
            this.dirty = true;
            if (typeof this.onFrameChange === "function")
            {
                this.onFrameChange(value);
            }
        }
    }

    /**
     * Get the total number of frame in the GIF.
     */
    get totalFrames()
    {
        return this._frameData.length;
    }

    /** Destroy and don't use after this. */
    destroy()
    {
        this.stop();
        super.destroy(true);
        this._context = null;
        this._frameData = null;
        this.onComplete = null;
        this.onFrameChange = null;
        this.onLoop = null;
    }

    /**
     * Cloning the animation is a useful way to create a duplicate animation.
     * This maintains all the properties of the original animation but allows
     * you to control playback independent of the original animation.
     * If you want to create a simple copy, and not control independently,
     * then you can simply create a new Sprite, e.g. `const sprite = new Sprite(animation.texture)`.
     */
    clone()
    {
        return new AnimatedGIF([...this._frameData], {
            autoUpdate: this._autoUpdate,
            loop: this.loop,
            autoPlay: this.autoPlay,
            scaleMode: this.texture.baseTexture.scaleMode,
            animationSpeed: this.animationSpeed,
            width: this._context.canvas.width,
            height: this._context.canvas.height,
            onComplete: this.onComplete,
            onFrameChange: this.onFrameChange,
            onLoop: this.onLoop,
        });
    }
}

export { AnimatedGIF };
// export type { AnimatedGIFOptions };
