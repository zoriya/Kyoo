//
// Created by Anonymus Raccoon on 16/12/2019.
//

#pragma once
#include <stdbool.h>
#include <stddef.h>
#include <libavformat/avformat.h>
#include <libavutil/log.h>

#define AV_LOG_LEVEL AV_LOG_WARNING

typedef enum
{
	none = 0,
	video = 1,
	audio = 2,
	subtitle = 3,
	attachment = 4
} type;

typedef struct stream
{
	char *title;
	char *language;
	char *codec;
	bool is_default;
	bool is_forced;
	char *path;
	type type;
} stream;

void extract_track(stream *track,
                   const char *out_path,
                   AVStream *stream,
                   AVFormatContext *in_ctx,
                   AVFormatContext **out_ctx,
                   bool reextract);
void extract_attachment(stream *font, const char *out_path, AVStream *stream);
void extract_chapters(AVFormatContext *ctx, const char *out_path);