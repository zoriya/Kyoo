#!/usr/bin/bash

#
# Small fix to support strict mode in subtitles-octopus while waiting for the PR to be merged & a new version to be released.
#


LINE_204="                self.video.addEventListener(\\\"loadedmetadata\\\", function listener(e) {"
LINE_205="                    e.target.removeEventListener(e.type, listener);"

sed -i "204s/.*/$LINE_204/" node_modules/libass-wasm/dist/js/subtitles-octopus.js
sed -i "205s/.*/$LINE_205/" node_modules/libass-wasm/dist/js/subtitles-octopus.js
