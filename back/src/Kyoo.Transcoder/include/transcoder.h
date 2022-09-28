//
// Created by Anonymus Raccoon on 15/12/2019.
//


#pragma once
#include "export.h"
#include "stream.h"

API int init();

API int transmux(const char *path, const char *out_path, float *playable_duration);

//API int transcode(const char *path, const char *out_path, float *playable_duration);

API stream *extract_infos(const char *path,
                          const char *out_path,
                          unsigned *stream_count,
                          unsigned *track_count,
                          bool reextract);

API void destroy_stream(stream *s);

API void free_streams(stream *streamsPtr, unsigned count);

