"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var method;
(function (method) {
    method[method["direct"] = 0] = "direct";
    method[method["transmux"] = 1] = "transmux";
    method[method["transcode"] = 2] = "transcode";
})(method = exports.method || (exports.method = {}));
;
function getPlaybackMethod(item) {
    return method.direct;
}
exports.getPlaybackMethod = getPlaybackMethod;
//# sourceMappingURL=playbackMethodDetector.js.map