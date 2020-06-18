#! /usr/bin/bash

REGEX="(?:\/(?<Collection>.*?))?\/(?<ShowTitle>.*)(?: \(\d+\))?\/\k<ShowTitle>(?: \(\d+\))?(?:(?: S(?<SeasonNumber>\d+)E(?<EpisodeNumber>\d+))| (?<AbsoluteNumber>\d+))?.*$"

find "$1" -type f \( -name '*.mp4' -o -name '*.mkv' \) | cut -c $((${#1} + 1))- | grep -viP "$REGEX"