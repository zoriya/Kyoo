"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var detect_browser_1 = require("detect-browser");
var method;
(function (method) {
    method["direct"] = "Direct Play";
    method["transmux"] = "Transmux";
    method["transcode"] = "Transcode";
})(method = exports.method || (exports.method = {}));
;
var SupportList = /** @class */ (function () {
    function SupportList() {
    }
    return SupportList;
}());
exports.SupportList = SupportList;
function getPlaybackMethod(player, item) {
    var supportList = getWhatIsSupported(player, item);
    if (supportList.container) {
        if (supportList.videoCodec && supportList.audioCodec)
            return method.direct;
        return method.transcode;
    }
    if (supportList.videoCodec && supportList.audioCodec)
        return method.transmux;
    return method.transcode;
}
exports.getPlaybackMethod = getPlaybackMethod;
function getWhatIsSupported(player, item) {
    var supportList = new SupportList();
    var browser = detect_browser_1.detect();
    if (!browser) {
        supportList.container = false;
        supportList.videoCodec = false;
        supportList.audioCodec = false;
    }
    else {
        supportList.container = containerIsSupported(player, item.container, browser.name) && item.audios.length <= 1;
        supportList.videoCodec = videoCodecIsSupported(player, item.video.codec, browser.name);
        supportList.audioCodec = audioCodecIsSupported(player, item.audios.map(function (value) { return value.codec; }), browser.name);
    }
    return (supportList);
}
exports.getWhatIsSupported = getWhatIsSupported;
function containerIsSupported(player, container, browser) {
    var supported = false;
    switch (container) {
        case "asf":
            supported = browser == "tizen" || browser == "orsay" || browser == "edge";
            //videoAudioCodecs = [];
            break;
        case "avi":
            supported = browser == "tizen" || browser == "orsay" || browser == "edge";
            break;
        case "mpg":
        case "mpeg":
            supported = browser == "tizen" || browser == "orsay" || browser == "edge";
            break;
        case "flv":
            supported = browser == "tizen" || browser == "orsay";
            break;
        case "3gp":
        case "mts":
        case "trp":
        case "vob":
        case "vro":
            supported = browser == "tizen" || browser == "orsay";
            break;
        case "mov":
            supported = browser == "tizen" || browser == "orsay" || browser == "edge" || browser == "chrome";
            break;
        case "m2ts":
            supported = browser == "tizen" || browser == "orsay" || browser == "edge";
            break;
        case "wmv":
            supported = browser == "tizen" || browser == "orsay" || browser == "edge";
            //videoAudioCodecs = [];
            break;
        case "ts":
            supported = browser == "tizen" || browser == "orsay" || browser == "edge";
            break;
        case "mp4":
        case "m4v":
            supported = true;
            break;
        case "mkv":
            supported = browser == "tizen" || browser == "orsay" || browser == "chrome" || browser == "edge";
            if (supported)
                break;
            if (player.canPlayType("video/x-matroska") || player.canPlayType("video/mkv"))
                supported = true;
            break;
        default:
            break;
    }
    return supported;
}
//SHOULD CHECK FOR DEPTH (8bits ok but 10bits unsuported for almost every browsers)
function videoCodecIsSupported(player, codec, browser) {
    switch (codec) {
        case "h264":
            return !!player.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'); //The !! is used to parse the string as a bool
        case "h265":
        case "hevc":
            if (browser == "tizen" || browser == "orsay" || browser == "xboxOne" || browser == "ios")
                return true;
            //SHOULD SUPPORT CHROMECAST ULTRA
            //  if (browser.chromecast)
            //	{
            //		var isChromecastUltra = userAgent.indexOf('aarch64') !== -1;
            //		if (isChromecastUltra)
            //		{
            //			return true;
            //		}
            //	}
            return !!player.canPlayType('video/hevc; codecs="hevc, aac"');
        case "mpeg2video":
            return browser == "orsay" || browser == "tizen" || browser == "edge";
        case "vc1":
            return browser == "orsay" || browser == "tizen" || browser == "edge";
        case "msmpeg4v2":
            return browser == "orsay" || browser == "tizen";
        case "vp8":
            return !!player.canPlayType('video/webm; codecs="vp8');
        case "vp9":
            return !!player.canPlayType('video/webm; codecs="vp9"');
        case "vorbis":
            return browser == "orsay" || browser == "tizen" || !!player.canPlayType('video/webm; codecs="vp8');
        default:
            return false;
    }
}
//SHOULD CHECK FOR NUMBER OF AUDIO CHANNEL (2 ok but 5 not in some browsers)
function audioCodecIsSupported(player, codecs, browser) {
    for (var _i = 0, codecs_1 = codecs; _i < codecs_1.length; _i++) {
        var codec = codecs_1[_i];
        switch (codec) {
            case "mp3":
                return !!player.canPlayType('video/mp4; codecs="avc1.640029, mp4a.69"') ||
                    !!player.canPlayType('video/mp4; codecs="avc1.640029, mp4a.6B"');
            case "aac":
                return !!player.canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.2"');
            case "mp2":
                return browser == "orsay" || browser == "tizen" || browser == "edge";
            case "pcm_s16le":
            case "pcm_s24le":
                return browser == "orsay" || browser == "tizen" || browser == "edge";
            case "aac_latm":
                return browser == "orsay" || browser == "tizen";
            case "opus":
                return !!player.canPlayType('audio/ogg; codecs="opus"');
            case "flac":
                return browser == "orsay" || browser == "tizen" || browser == "edge";
            default:
                return false;
        }
    }
}
//# sourceMappingURL=playbackMethodDetector.js.map