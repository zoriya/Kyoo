//
// Created by Anonymus Raccoon on 20/12/2019.
//

#include <compatibility.h>
#include <stdio.h>
#include "export.h"
#include "stream.h"
#include "helper.h"

API int init()
{
	puts("Kyoo's transcoder initiated.");
	return sizeof(stream);
}

void write_to_outputs(AVFormatContext **output_list, AVFormatContext *in_ctx)
{
	AVPacket pkt;

	while (av_read_frame(in_ctx, &pkt) == 0) {
		AVFormatContext *out_ctx;

		if ((unsigned)pkt.stream_index >= in_ctx->nb_streams)
			continue;
		out_ctx = output_list[pkt.stream_index];
		if (!out_ctx) {
			av_packet_unref(&pkt);
			continue;
		}
		process_packet(&pkt, in_ctx->streams[pkt.stream_index], out_ctx->streams[0]);
		pkt.stream_index = 0;
		if (av_interleaved_write_frame(out_ctx, &pkt) < 0)
			av_log(NULL, AV_LOG_ERROR, "Error while writing a packet to the output file.\n");
		av_packet_unref(&pkt);
	}

	for (unsigned i = 0; i < in_ctx->nb_streams; i++) {
		AVFormatContext *out_ctx = output_list[i];

		if (!out_ctx)
			continue;
		av_write_trailer(out_ctx);
		if (!(out_ctx->flags & AVFMT_NOFILE))
			avio_closep(&out_ctx->pb);
		avformat_free_context(out_ctx);
	}
}

bool list_empty(void **list, unsigned count)
{
	for (unsigned i = 0; i < count; i++)
		if (list[i])
			return false;
	return true;
}

stream parse_stream(AVStream *stream, type stream_type, const char *path)
{
	const AVCodecParameters *codecpar = stream->codecpar;
	AVDictionaryEntry *languageptr = av_dict_get(stream->metadata, "language", NULL, 0);

	return (struct stream){
		NULL,
		languageptr ? strdup(languageptr->value) : NULL,
		strdup(avcodec_get_name(codecpar->codec_id)),
		stream->disposition & AV_DISPOSITION_DEFAULT,
		stream->disposition & AV_DISPOSITION_FORCED,
		strdup(path),
		stream_type
	};
}

API stream *extract_infos(const char *path,
                          const char *out_path,
                          unsigned *stream_count,
                          unsigned *track_count,
                          bool reextract)
{
	AVFormatContext *ctx = NULL;
	AVFormatContext **output_list;
	stream *streams;

	if (open_input_context(&ctx, path) != 0)
		return NULL;
	*stream_count = ctx->nb_streams;
	*track_count = 0;
	streams = calloc(ctx->nb_streams, sizeof(stream));
	output_list = calloc(ctx->nb_streams, sizeof(AVFormatContext *));

	if (output_list && streams) {
		extract_chapters(ctx, out_path);
		for (unsigned i = 0; i < *stream_count; i++) {
			AVStream *stream = ctx->streams[i];
			type stream_type = type_fromffmpeg(stream);

			if (stream_type == none)
				continue;
			*track_count += 1;
			streams[i] = parse_stream(stream, stream_type, path);
			if (stream_type == subtitle)
				extract_track(&streams[i], out_path, stream, ctx, &output_list[i], reextract);
			if (stream_type == attachment)
				extract_attachment(&streams[i], out_path, stream);
		}
	}
	if (!list_empty((void **)output_list, ctx->nb_streams))
		write_to_outputs(output_list, ctx);
	avformat_close_input(&ctx);
	if (!output_list) {
		free(streams);
		return NULL;
	}
	free(output_list);
	return streams;
}