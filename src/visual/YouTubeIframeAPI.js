/**
 * Wrapper for the YouTube Iframe API.
 *
 * @author Nikita Agafonov & Alain Pitiot
 * @version 2023.2.0
 * @copyright (c) 2020-2025 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as util from "../util/Util.js";

class YouTubeIframeAPI
{
	constructor()
	{
		this.isReady = false;
		this._initResolver = undefined;
		this._initPromise = undefined;
	}

	init()
	{
		if (this.isReady)
		{
			return Promise.resolve();
		}

		// If init is in progress but not done yet, return the promise.
		// This is the case when multiple movie stims are created simultaneously.
		if (this._initPromise)
		{
			return this._initPromise;
		}

		// note: the below code is following the documentation at:
		// https://developers.google.com/youtube/iframe_api_reference

		window.onYouTubeIframeAPIReady = this._onYoutubeIframeAPIReady.bind(this);

		const script = document.createElement("script");
		script.src = "https://www.youtube.com/iframe_api";
		const firstScriptTag = document.getElementsByTagName("script")[0];
		firstScriptTag.parentNode.insertBefore(script, firstScriptTag);

		this._initPromise = new Promise((res, rej) =>
		{
			this._initResolver = res;
		});

		return this._initPromise;
	}

	createPlayer(params = {})
	{
		const uuid = util.makeUuid();
		document.body.insertAdjacentHTML("beforeend",
			`<div class="yt-player-wrapper">
				<div id="yt-iframe-placeholder-${uuid}" class="yt-iframe"></div>
			</div>`);
		document.querySelector(`#yt-iframe-placeholder-${uuid}`).parentElement.classList.add("inprogress");

		const originalOnready = params.events.onReady;
		params.events.onReady = (event) =>
		{
			document.querySelector(`#yt-iframe-placeholder-${uuid}`).parentElement.classList.remove("inprogress");
			if (typeof originalOnready === "function")
			{
				originalOnready(event);
			}
		};

		const ytPlayer = new YT.Player(`yt-iframe-placeholder-${uuid}`,
			params
		);

		return ytPlayer;
	}

	destroyPlayer(ytPlayer)
	{
		const elementId = ytPlayer.getIframe().id;
		ytPlayer.destroy();

		// At this point youtubeAPI destroyed the player and returned the placeholder div back in place instead of it.
		// Cleaning up.
		document.getElementById(elementId).parentElement.remove();
	}

	_onYoutubeIframeAPIReady()
	{
		this.isReady = true;
		this._initResolver();
	}
}

const YouTubeIframeAPIHandler = new YouTubeIframeAPI();
export default YouTubeIframeAPIHandler;
