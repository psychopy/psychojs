/**
 * Provides a class to work with Youtube Iframe API. See https://developers.google.com/youtube/iframe_api_reference
 *
 * @author Nikita Agafonov
 * @version 2022.3.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2023 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 *
 */

class YoutubeIframeAPI
{
	constructor ()
	{
		this.isReady = false;
		this._initResolver = undefined;
	}

	_onYoutubeIframeAPIReady ()
	{
		console.log("ytplayer rdy");
		this.isReady = true;
		this._initResolver();
	}

	_handlePostMessage (event)
	{
	  // Check that the event was sent from the YouTube IFrame.
		// console.log(event)
		// if (event.source === iframeWindow) {
		var data = JSON.parse(event.data);

		  // The "infoDelivery" event is used by YT to transmit any
		  // kind of information change in the player,
		  // such as the current time or a playback quality change.
		if (
			data.event === "infoDelivery" &&
			data.info &&
			data.info.currentTime
			) {
			// currentTime is emitted very frequently (milliseconds),
			// but we only care about whole second changes.
			var time = Math.floor(data.info.currentTime);
			console.log(time);

			// if (time !== lastTimeUpdate)
			// {
			//   lastTimeUpdate = time;

			//   // It's now up to you to format the time.
			//   document.getElementById("time").innerHTML = time;
			// }
		}
		// }
	}

	async init ()
	{
		if (this.isReady)
		{
			return Promise.resolve();
		}

		// Called by Youtube script.
		window.onYouTubeIframeAPIReady = this._onYoutubeIframeAPIReady.bind(this);

		let el = document.createElement("script");
		el.src = "https://www.youtube.com/iframe_api";
		let firstScriptTag = document.getElementsByTagName("script")[0];
		firstScriptTag.parentNode.insertBefore(el, firstScriptTag);

		document.body.insertAdjacentHTML("beforeend", "<div id='yt-iframe-placeholder' class='yt-iframe'></div>");

		// var iframeWindow = player.getIframe().contentWindow;
		window.addEventListener("message", this._handlePostMessage.bind(this));

		return new Promise((res, rej) => {
			this._initResolver = res;
		});
	}

	createPlayer (params = {})
	{
		return new YT.Player("yt-iframe-placeholder",
			params
		);
	}
}

const YTAPISingleTon = new YoutubeIframeAPI();
export default YTAPISingleTon;
