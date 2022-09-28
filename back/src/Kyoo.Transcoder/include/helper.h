//
// Created by Anonymus Raccoon on 15/12/2019.
//

#pragma once

#include <libavformat/avformat.h>
#include <libavutil/dict.h>
#include <libavutil/timestamp.h>
#include "stream.h"

int open_input_context(AVFormatContext **inputContext, const char *path);
AVStream *copy_stream_to_output(AVFormatContext *out_ctx, AVStream *in_stream);
int open_output_file_for_write(AVFormatContext *out_ctx, const char *out_path, AVDictionary **options);
void process_packet(AVPacket *pkt, AVStream *in_stream, AVStream *out_stream);
type type_fromffmpeg(AVStream *stream);