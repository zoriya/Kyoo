#pragma clang diagnostic push
#pragma ide diagnostic ignored "hicpp-signed-bitwise"
#pragma ide diagnostic ignored "cppcoreguidelines-narrowing-conversions"
#include "transcoder.h"
#include "helper.h"
#include "compatibility.h"


stream *get_track_info(const char *path, int *stream_count, int *track_count)
{
	AVFormatContext *ctx = NULL;
	stream *streams;

	if (open_input_context(&ctx, path) != 0)
		return (NULL);
	*stream_count = ctx->nb_streams;
	*track_count = 0;
	streams = malloc(sizeof(stream) * *stream_count);

	for (int i = 0; i < *stream_count; i++) {
		AVStream *stream = ctx->streams[i];
		const AVCodecParameters *codecpar = stream->codecpar;

		if (codecpar->codec_type == AVMEDIA_TYPE_VIDEO || codecpar->codec_type == AVMEDIA_TYPE_AUDIO) {
			AVDictionaryEntry *languageptr = av_dict_get(stream->metadata, "language", NULL, 0);

			*track_count += 1;
			streams[i] = (struct stream){
				codecpar->codec_type == AVMEDIA_TYPE_VIDEO ? "VIDEO" : NULL,
				languageptr ? strdup(languageptr->value) : NULL,
				strdup(avcodec_get_name(codecpar->codec_id)),
				stream->disposition & AV_DISPOSITION_DEFAULT,
				stream->disposition & AV_DISPOSITION_FORCED,
				strdup(path)
			};
		}
		else
			streams[i] = NULLSTREAM;
	}
	avformat_close_input(&ctx);
	return (streams);
}

int transmux(const char *path, const char *out_path, float *playable_duration)
{
	AVFormatContext *in_ctx = NULL;
	AVFormatContext *out_ctx = NULL;
	AVStream *stream;
	AVPacket pkt;
	AVDictionary *options = NULL;
	int *stream_map;
	int stream_count;
	int ret = 0;
	std::string seg_path = ((std::string)out_path).substr(0, strrchr(out_path, '/') - out_path).append("/segments/");

	*playable_duration = 0;
	if (open_input_context(&in_ctx, path) != 0)
		return 1;

	if (avformat_alloc_output_context2(&out_ctx, NULL, NULL, out_path) < 0)
	{
		std::cout << "Error: Couldn't create an output file." << std::endl;
		return 1;
	}

	stream_map = new int[in_ctx->nb_streams];
	stream_count = 0;

	for (unsigned int i = 0; i < in_ctx->nb_streams; i++)
	{
		stream = in_ctx->streams[i];
		if (stream->codecpar->codec_type == AVMEDIA_TYPE_VIDEO)
		{
			stream_map[i] = stream_count;
			stream_count++;
			if (copy_stream_to_output(out_ctx, stream) == NULL)
				return 1;
		}
		else if (stream->codecpar->codec_type == AVMEDIA_TYPE_AUDIO) //Should support multi-audio on a good format.
		{
			stream_map[i] = stream_count;
			stream_count++;
			if (copy_stream_to_output(out_ctx, stream) == NULL)
				return 1;
		}
		else
			stream_map[i] = -1;
	}

	av_dump_format(out_ctx, 0, out_path, true);
	std::filesystem::create_directory(seg_path);
	av_dict_set(&options, "hls_segment_filename", seg_path.append("%v-%03d.ts").c_str(), 0);
	av_dict_set(&options, "hls_base_url", "segment/", 0);
	av_dict_set(&options, "hls_list_size", "0", 0);
	av_dict_set(&options, "streaming", "1", 0);

	if (open_output_file_for_write(out_ctx, out_path, &options) != 0)
		return 1;

	while (av_read_frame(in_ctx, &pkt) == 0)
	{
		if ((unsigned int)pkt.stream_index >= in_ctx->nb_streams || stream_map[pkt.stream_index] < 0)
		{
			av_packet_unref(&pkt);
			continue;
		}

		stream = in_ctx->streams[pkt.stream_index];
		pkt.stream_index = stream_map[pkt.stream_index];
		process_packet(pkt, stream, out_ctx->streams[pkt.stream_index]);
		if (pkt.stream_index == 0)
			*playable_duration += pkt.duration * (float)out_ctx->streams[pkt.stream_index]->time_base.num / out_ctx->streams[pkt.stream_index]->time_base.den;

		if (av_interleaved_write_frame(out_ctx, &pkt) < 0)
			std::cout << "Error while writing a packet to the output file." << std::endl;

		av_packet_unref(&pkt);
	}

	av_dict_free(&options);
	av_write_trailer(out_ctx);
	avformat_close_input(&in_ctx);

	if (out_ctx && !(out_ctx->oformat->flags & AVFMT_NOFILE))
		avio_close(out_ctx->pb);
	avformat_free_context(out_ctx);
	delete[] stream_map;

	if (ret < 0 && ret != AVERROR_EOF)
		return 1;

	return 0;
}

void free_memory(Stream *stream_ptr)
{
	delete[] stream_ptr;
}
#pragma clang diagnostic pop