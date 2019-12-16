#include <stdio.h>
#include <stdbool.h>
#include "helper.h"

int open_input_context(AVFormatContext **in_ctx, const char *path)
{
	if (avformat_open_input(in_ctx, path, NULL, NULL)) {
		printf("Error: Can't open the file at %s.\n", path);
		return (1);
	}
	if (avformat_find_stream_info(*in_ctx, NULL) < 0) {
		printf("Error: Could't find streams informations for the file at %s.\n", path);
		return (1);
	}
	av_dump_format(*in_ctx, 0, path, false);
	return (0);
}

AVStream *copy_stream_to_output(AVFormatContext *out_ctx, AVStream *in_stream)
{
	AVStream *out_stream = avformat_new_stream(out_ctx, NULL);

	if (out_stream == NULL) {
		printf("Error: Couldn't create stream.\n");
		return (NULL);
	}
	if (avcodec_parameters_copy(out_stream->codecpar, in_stream->codecpar) < 0) {
		printf("Error: Couldn't copy parameters to the output file.\n");
		return (NULL);
	}
	out_stream->codecpar->codec_tag = 0;
	avformat_transfer_internal_stream_timing_info(out_ctx->oformat, out_stream, in_stream, AVFMT_TBCF_AUTO);
	out_stream->time_base = av_add_q(av_stream_get_codec_timebase(out_stream), (AVRational){0, 1});
	out_stream->duration = av_rescale_q(in_stream->duration, in_stream->time_base, out_stream->time_base);
	out_stream->disposition = in_stream->disposition;
	out_stream->avg_frame_rate = in_stream->avg_frame_rate;
	out_stream->r_frame_rate = in_stream->r_frame_rate;
	return (out_stream);
}

int open_output_file_for_write(AVFormatContext *out_ctx, const char *out_path, AVDictionary **options)
{
	if (!(out_ctx->oformat->flags & AVFMT_NOFILE)) {
		if (avio_open(&out_ctx->pb, out_path, AVIO_FLAG_WRITE) < 0) {
			printf("Error: Couldn't open file at %s.\n", out_path);
			return (1);
		}
	}
	else
		printf("Output flag set to AVFMT_NOFILE.\n");
	if (avformat_write_header(out_ctx, options) < 0) {
		printf("Error: Couldn't write headers to file at %s.\n", out_path);
		return (1);
	}
	return (0);
}

void process_packet(AVPacket *pkt, AVStream *in_stream, AVStream *out_stream)
{
	pkt->pts = av_rescale_q_rnd(pkt->pts, in_stream->time_base, out_stream->time_base, AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX);
	pkt->dts = av_rescale_q_rnd(pkt->dts, in_stream->time_base, out_stream->time_base, AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX);
	pkt->duration = av_rescale_q(pkt->duration, in_stream->time_base, out_stream->time_base);
	pkt->pos = -1;
}