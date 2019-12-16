//
// Created by Anonymus Raccoon on 16/12/2019.
//

#include "transcoder.h"
#include "stream.h"
#include "helper.h"
#include "compatibility.h"
#include <sys/stat.h>
#include <sys/types.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int get_subtitle_data(stream *substream, AVStream *in_stream, const char *folder_name, const char *out_path)
{
	AVDictionaryEntry *languageptr = av_dict_get(in_stream->metadata, "language", NULL, 0);
	char *extension;
	char *codec;

	codec = strdup(avcodec_get_name(in_stream->codecpar->codec_id));
	if (!strcmp(codec, "subrip"))
		extension = ".srt";
	else if (!strcmp(codec, "ass"))
		extension = ".ass";
	else {
		printf("Unsupported subtitle codec: %s.\n", codec);
		free(codec);
		return (-1);
	}
	*substream = (stream) {
		NULL,
		languageptr ? languageptr->value : NULL,
		codec,
		in_stream->disposition & AV_DISPOSITION_DEFAULT,
		in_stream->disposition & AV_DISPOSITION_FORCED,
		NULL
	};
	asprintf(&substream->path, "%s/%s", out_path, substream->language);
	if (mkdir(substream->path, 0733) < 0) {
		stream_free(substream);
		return (-1);
	}
	asprintf(&substream->path, "%s/%s.%s%s%s%s", substream->path,
			 folder_name,
			 substream->language,
			 substream->is_default ? ".default" : "",
			 substream->is_forced ? ".forced" : "",
			 extension);
	return (0);
}

int copy_subtitle_stream(AVFormatContext **out, stream *s, AVFormatContext *int_ctx, AVStream *in_stream)
{
	AVFormatContext *out_ctx = NULL;
	AVStream *out_stream = NULL;

	if (avformat_alloc_output_context2(&out_ctx, NULL, NULL, s->path) < 0) {
		printf("Error: Couldn't create an output file.\n");
		return (-1);
	}

	av_dict_copy(&out_ctx->metadata, int_ctx->metadata, 0);
	out_stream = copy_stream_to_output(out_ctx, in_stream);
	if (out_stream) {
		av_dump_format(out_ctx, 0, s->path, true);
		if (open_output_file_for_write(out_ctx, s->path, NULL) == 0) {
			*out = out_ctx;
			return (0);
		}
	}

	if (out_ctx && !(out_ctx->flags & AVFMT_NOFILE))
		avio_closep(&out_ctx->pb);
	avformat_free_context(out_ctx);

	*out = NULL;
	printf("An error occured, cleaning up th output context for the %s stream.\n", s->language);
	return (-1);
}

stream *extract_subtitles(char *path, const char *out_path, int *stream_count, int *subtitle_count)
{
	AVFormatContext *int_ctx = NULL;
	AVFormatContext **output_list;
	stream *streams;
	AVPacket pkt;
	unsigned int out_count;
	char *folder_name = strchr(path, '/');
	char *p;

	if (!folder_name)
		return (NULL);
	p = strchr(folder_name, '.');
	if (p)
		*p = '\0';

	if (open_input_context(&int_ctx, path) != 0)
		return (NULL);
	*stream_count = int_ctx->nb_streams;
	*subtitle_count = 0;
	streams = malloc(sizeof(stream) * *stream_count);
	out_count = int_ctx->nb_streams;
	output_list = malloc(sizeof(AVFormatContext *) * out_count);

	for (unsigned int i = 0; i < int_ctx->nb_streams; i++) {
		AVStream *in_stream = int_ctx->streams[i];

		if (in_codecpar->codec_type != AVMEDIA_TYPE_SUBTITLE) {
			output_list[i] = NULL;
			streams[i] = NULLSTREAM;
		} else {
			if (get_subtitle_data(&streams[i], in_stream, folder_name, out_path) == 0) {
				if (copy_subtitle_stream(&output_list[i], &streams[i], int_ctx, in_stream) == 0) {
					*subtitle_count += 1;
					continue;
				}
			}
			streams[i] = NULLSTREAM;
			output_list[i] = NULL;
		}
	}

	//Write subtitle data to files.
	while (av_read_frame(int_ctx, &pkt) == 0)
	{
		if ((unsigned int)pkt.stream_index >= out_count)
			continue;

		AVFormatContext *out_ctx = output_list[pkt.stream_index];
		if (out_ctx == nullptr)
		{
			av_packet_unref(&pkt);
			continue;
		}

		process_packet(pkt, int_ctx->streams[pkt.stream_index], out_ctx->streams[0]);
		pkt.stream_index = 0;

		if (av_interleaved_write_frame(out_ctx, &pkt) < 0)
			std::cout << "Error while writing a packet to the output file." << std::endl;

		av_packet_unref(&pkt);
	}

	avformat_close_input(&int_ctx);

	for (unsigned int i = 0; i < out_count; i++)
	{
		AVFormatContext *out_ctx = output_list[i];

		if (out_ctx == NULL)
			continue;

		av_write_trailer(out_ctx);

		if (out_ctx && !(out_ctx->flags & AVFMT_NOFILE))
			avio_closep(&out_ctx->pb);
		avformat_free_context(out_ctx);
	}

	delete[] output_list;
	return streams;
}
