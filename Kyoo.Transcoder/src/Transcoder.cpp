#include <filesystem>
#include <sstream>
#include "transcoder.h"
#include "helper.h"

int Init()
{
	return sizeof(Stream);
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

	std::filesystem::create_directory(((std::string)out_path).substr(0, strrchr(out_path, '/') - out_path).append("/dash/"));
	av_dict_set(&options, "init_seg_name", "dash/init-stream$RepresentationID$.m4s", 0);
	av_dict_set(&options, "media_seg_name", "dash/chunk-stream$RepresentationID$-$Number%05d$.m4s", 0);
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


Stream *extract_subtitles(const char *path, const char *out_path, int *stream_count, int *subtitle_count)
{
	AVFormatContext *int_ctx = NULL;
	AVFormatContext **output_list;
	Stream *streams;
	AVPacket pkt;
	unsigned int out_count;

	if (open_input_context(&int_ctx, path) != 0)
		return nullptr;

	*stream_count = int_ctx->nb_streams;
	*subtitle_count = 0;
	streams = new Stream[*stream_count];

	out_count = int_ctx->nb_streams;
	output_list = new AVFormatContext *[out_count];

	//Initialize output and set headers.
	for (unsigned int i = 0; i < int_ctx->nb_streams; i++)
	{
		AVStream *in_stream = int_ctx->streams[i];
		const AVCodecParameters *in_codecpar = in_stream->codecpar;

		if (in_codecpar->codec_type != AVMEDIA_TYPE_SUBTITLE)
			output_list[i] = NULL;
		else
		{
			*subtitle_count += 1;

			AVDictionaryEntry *languageptr = av_dict_get(in_stream->metadata, "language", NULL, 0);

			//Get metadata for file name
			streams[i] = Stream(NULL, //title
				languageptr ? languageptr->value : NULL, //language
				avcodec_get_name(in_codecpar->codec_id), //format
				in_stream->disposition & AV_DISPOSITION_DEFAULT, //isDefault
				in_stream->disposition & AV_DISPOSITION_FORCED);  //isForced

			//Create the language subfolder
			std::stringstream out_strstream;
			out_strstream << out_path << (char)std::filesystem::path::preferred_separator << streams[i].language;
			std::filesystem::create_directory(out_strstream.str());

			//Get file name
			std::string file_name(path);
			size_t last_separator = file_name.find_last_of((char)std::filesystem::path::preferred_separator);
			file_name = file_name.substr(last_separator, file_name.find_last_of('.') - last_separator);

			//Construct output file name
			out_strstream << file_name << "." << streams[i].language;

			if (streams[i].is_default)
				out_strstream << ".default";
			if (streams[i].is_forced)
				out_strstream << ".forced";

			if (strcmp(streams[i].codec, "subrip") == 0)
				out_strstream << ".srt";
			else if (strcmp(streams[i].codec, "ass") == 0)
				out_strstream << ".ass";
			else
			{
				std::cout << "Unsupported subtitle codec: " << streams[i].codec << std::endl;
				output_list[i] = NULL;
				continue;
			}

			streams[i].path = strdup(out_strstream.str().c_str());

			std::cout << "Stream #" << i << "(" << streams[i].language << "), stream type: " << in_codecpar->codec_type << " codec: " << streams[i].codec << std::endl;

			AVFormatContext *out_ctx = NULL;
			if (avformat_alloc_output_context2(&out_ctx, NULL, NULL, streams[i].path) < 0)
			{
				std::cout << "Error: Couldn't create an output file." << std::endl;
				continue;
			}

			av_dict_copy(&out_ctx->metadata, int_ctx->metadata, NULL);

			AVStream *out_stream = copy_stream_to_output(out_ctx, in_stream);
			if (out_stream == NULL)
				goto end;

			av_dump_format(out_ctx, 0, streams[i].path, true);

			if (open_output_file_for_write(out_ctx, streams[i].path, NULL) != 0)
				goto end;

			output_list[i] = out_ctx;

			if (false)
			{
			end:
				if (out_ctx && !(out_ctx->flags & AVFMT_NOFILE))
					avio_closep(&out_ctx->pb);
				avformat_free_context(out_ctx);

				output_list[i] = nullptr;
				std::cout << "An error occured, cleaning up th output context for the stream #" << i << std::endl;
			}
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

void free_memory(Stream *stream_ptr)
{
	delete[] stream_ptr;
}