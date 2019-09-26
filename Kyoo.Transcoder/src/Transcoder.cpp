#include "pch.h"
#include <filesystem>
#include <sstream>
#include "Transcoder.h"

//ffmpeg imports
extern "C"
{
	#include <libavformat/avformat.h>
	#include <libavutil/dict.h>
	#include <libavutil/timestamp.h>
}

constexpr enum AVRounding operator |(const enum AVRounding a, const enum AVRounding b)
{
	return (enum AVRounding)(uint32_t(a) | uint32_t(b));
}

int Init()
{
	return sizeof(Stream);
}


#pragma region InternalProcess
int open_input_context(AVFormatContext **inputContext, const char *path)
{
	if (avformat_open_input(inputContext, path, NULL, NULL))
	{
		std::cout << "Error: Can't open the file at " << path << std::endl;
		return 1;
	}

	if (avformat_find_stream_info(*inputContext, NULL) < 0)
	{
		std::cout << "Error: Could't find streams informations for the file at " << path << std::endl;
		return 1;
	}

	av_dump_format(*inputContext, 0, path, false);
	return 0;
}

AVStream* copy_stream_to_output(AVFormatContext *outputContext, AVStream *inputStream)
{
	AVStream *outputStream = avformat_new_stream(outputContext, NULL);
	if (outputStream == NULL)
	{
		std::cout << "Error: Couldn't create stream." << std::endl;
		return NULL;
	}

	if (avcodec_parameters_copy(outputStream->codecpar, inputStream->codecpar) < 0)
	{
		std::cout << "Error: Couldn't copy parameters to the output file." << std::endl;
		return NULL;
	}
	outputStream->codecpar->codec_tag = 0;

	avformat_transfer_internal_stream_timing_info(outputContext->oformat, outputStream, inputStream, AVTimebaseSource::AVFMT_TBCF_AUTO);
	outputStream->time_base = av_add_q(av_stream_get_codec_timebase(outputStream), AVRational{ 0, 1 });
	outputStream->duration = av_rescale_q(inputStream->duration, inputStream->time_base, outputStream->time_base);
	outputStream->disposition = inputStream->disposition;
	outputStream->avg_frame_rate = inputStream->avg_frame_rate;
	outputStream->r_frame_rate = inputStream->r_frame_rate;

	//av_dict_copy(&outputStream->metadata, inputStream->metadata, NULL);

	//if (inputStream->nb_side_data)
	//{
	//	for (int i = 0; i < inputStream->nb_side_data; i++)
	//	{
	//		std::cout << "Copying side packet #" << i << std::endl;

	//		AVPacketSideData *sidePkt = &inputStream->side_data[i];
	//		uint8_t *newPkt = av_stream_new_side_data(outputStream, sidePkt->type, sidePkt->size);
	//		if (newPkt == NULL)
	//		{
	//			std::cout << "Error copying side package." << std::endl;
	//			//Should handle return here
	//			return;
	//		}
	//		memcpy(newPkt, sidePkt->data, sidePkt->size);
	//	}
	//}

	return outputStream;
}

int open_output_file_for_write(AVFormatContext *outputContext, const char* outputPath)
{
	if (!(outputContext->flags & AVFMT_NOFILE))
	{
		if (avio_open(&outputContext->pb, outputPath, AVIO_FLAG_WRITE) < 0)
		{
			std::cout << "Error: Couldn't open file at " << outputPath << std::endl;
			return 1;
		}
	}
	else
		std::cout << "Output flag set to AVFMT_NOFILE." << std::endl;

	if (avformat_write_header(outputContext, NULL) < 0)
	{
		std::cout << "Error: Couldn't write headers to file at " << outputPath << std::endl;
		return 1;
	}

	return 0;
}

void process_packet(AVPacket &pkt, AVStream* inputStream, AVStream* outputStream)
{
	pkt.pts = av_rescale_q_rnd(pkt.pts, inputStream->time_base, outputStream->time_base, AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX);
	pkt.dts = av_rescale_q_rnd(pkt.dts, inputStream->time_base, outputStream->time_base, AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX);
	pkt.duration = av_rescale_q(pkt.duration, inputStream->time_base, outputStream->time_base);
	pkt.pos = -1;
}
#pragma endregion




int Transmux(const char *path, const char *outPath)
{
	AVFormatContext *inputContext = NULL;
	int ret = 0;

	if (open_input_context(&inputContext, path) != 0)
		return 1;

	AVFormatContext *outputContext = NULL;
	if (avformat_alloc_output_context2(&outputContext, NULL, NULL, outPath) < 0)
	{
		std::cout << "Error: Couldn't create an output file." << std::endl;
		return 1;
	}

	int *streamsMap = new int[inputContext->nb_streams];
	int streamCount = 0;

	for (unsigned int i = 0; i < inputContext->nb_streams; i++)
	{
		AVStream *stream = inputContext->streams[i];
		if (stream->codecpar->codec_type == AVMEDIA_TYPE_VIDEO)
		{
			streamsMap[i] = streamCount;
			streamCount++;
			if (copy_stream_to_output(outputContext, stream) == NULL)
				return 1;
		}
		else if (stream->codecpar->codec_type == AVMEDIA_TYPE_AUDIO) //Should support multi-audio on a good format.
		{
			streamsMap[i] = streamCount;
			streamCount++;
			if (copy_stream_to_output(outputContext, stream) == NULL)
				return 1;
		}
		else
			streamsMap[i] = -1;
	}

	av_dump_format(outputContext, 0, outPath, true);
	if (open_output_file_for_write(outputContext, outPath) != 0)
		return 1;

	AVPacket pkt;
	while (av_read_frame(inputContext, &pkt) == 0)
	{
		if (pkt.stream_index >= inputContext->nb_streams || streamsMap[pkt.stream_index] < 0)
		{
			av_packet_unref(&pkt);
			continue;
		}

		AVStream *inputStream = inputContext->streams[pkt.stream_index];
		pkt.stream_index = streamsMap[pkt.stream_index];
		AVStream *outputStream = outputContext->streams[pkt.stream_index];

		process_packet(pkt, inputStream, outputStream);

		if (av_interleaved_write_frame(outputContext, &pkt) < 0)
			std::cout << "Error while writing a packet to the output file." << std::endl;

		av_packet_unref(&pkt);
	}

	av_write_trailer(outputContext);
	avformat_close_input(&inputContext);

	if (outputContext && !(outputContext->oformat->flags & AVFMT_NOFILE))
		avio_closep(&outputContext->pb);
	avformat_free_context(outputContext);
	delete[] streamsMap;

	if (ret < 0 && ret != AVERROR_EOF)
		return 1;

	return 0;
}


Stream *ExtractSubtitles(const char *path, const char *outPath, int *streamCount, int *subtitleCount)
{
	AVFormatContext *inputContext = NULL;

	if (open_input_context(&inputContext, path) != 0)
		return nullptr;

	*streamCount = inputContext->nb_streams;
	*subtitleCount = 0;
	Stream *subtitleStreams = new Stream[*streamCount];

	const unsigned int outputCount = inputContext->nb_streams;
	AVFormatContext **outputList = new AVFormatContext*[outputCount];

	//Initialize output and set headers.
	for (unsigned int i = 0; i < inputContext->nb_streams; i++)
	{
		AVStream *inputStream = inputContext->streams[i];
		const AVCodecParameters *inputCodecpar = inputStream->codecpar;

		if (inputCodecpar->codec_type != AVMEDIA_TYPE_SUBTITLE)
			outputList[i] = NULL;
		else
		{			
			//Get metadata for file name
			Stream stream(NULL, //title
				av_dict_get(inputStream->metadata, "language", NULL, 0)->value, //language
				avcodec_get_name(inputCodecpar->codec_id), //format
				inputStream->disposition & AV_DISPOSITION_DEFAULT, //isDefault
				inputStream->disposition & AV_DISPOSITION_FORCED, //isForced
				NULL); //Path builder references 

			//Create the language subfolder
			std::stringstream outStream;
			outStream << outPath << (char)std::filesystem::path::preferred_separator << stream.language;
			std::filesystem::create_directory(outStream.str());

			//Get file name
			std::string fileName(path);
			size_t lastSeparator = fileName.find_last_of((char)std::filesystem::path::preferred_separator);
			fileName = fileName.substr(lastSeparator, fileName.find_last_of('.') - lastSeparator);

			//Construct output file name
			outStream << fileName << "." << stream.language;

			if (stream.isDefault)
				outStream << ".default";
			if (stream.isForced)
				outStream << ".forced";

			if (strcmp(stream.codec, "subrip") == 0)
				outStream << ".srt";
			else if (strcmp(stream.codec, "ass") == 0)
				outStream << ".ass";


			stream.path = _strdup(outStream.str().c_str());

			subtitleStreams[i] = stream;
			*subtitleCount += 1;

			std::cout << "Stream #" << i << "(" << stream.language << "), stream type: " << inputCodecpar->codec_type << " codec: " << stream.codec << std::endl;

			AVFormatContext *outputContext = NULL;
			if (avformat_alloc_output_context2(&outputContext, NULL, NULL, stream.path) < 0)
			{
				std::cout << "Error: Couldn't create an output file." << std::endl;
				continue;
			}

			av_dict_copy(&outputContext->metadata, inputContext->metadata, NULL);

			AVStream *outputStream = copy_stream_to_output(outputContext, inputStream);
			if (outputStream == NULL)
				goto end;

			av_dump_format(outputContext, 0, stream.path, true);

			if (open_output_file_for_write(outputContext, stream.path) != 0)
				goto end;

			outputList[i] = outputContext;

			if (false)
			{
			end:
				if (outputContext && !(outputContext->flags & AVFMT_NOFILE))
					avio_closep(&outputContext->pb);
				avformat_free_context(outputContext);

				outputList[i] = nullptr;
				std::cout << "An error occured, cleaning up th output context for the stream #" << i << std::endl;
			}
		}
	}

	//Write subtitle data to files.
	AVPacket pkt;
	while (av_read_frame(inputContext, &pkt) == 0)
	{
		if (pkt.stream_index >= outputCount)
			continue;

		AVFormatContext *outputContext = outputList[pkt.stream_index];
		if (outputContext == nullptr)
		{
			av_packet_unref(&pkt);
			continue;
		}

		AVStream *inputStream = inputContext->streams[pkt.stream_index];
		AVStream *outputStream = outputContext->streams[0];

		pkt.stream_index = 0;
		process_packet(pkt, inputStream, outputStream);

		if (av_interleaved_write_frame(outputContext, &pkt) < 0)
		{
			std::cout << "Error while writing a packet to the output file." << std::endl;
		}

		av_packet_unref(&pkt);
	}

	avformat_close_input(&inputContext);

	for (unsigned int i = 0; i < outputCount; i++)
	{
		AVFormatContext *outputContext = outputList[i];

		if (outputContext == NULL)
			continue;

		av_write_trailer(outputContext);

		if (outputContext && !(outputContext->flags & AVFMT_NOFILE))
			avio_closep(&outputContext->pb);
		avformat_free_context(outputContext);
	}

	delete[] outputList;
	return subtitleStreams;
}

void FreeMemory(Stream *streamsPtr)
{
	delete[] streamsPtr;
}

Stream *TestMemory(const char *path, const char *outPath, int *streamCount, int *subtitleCount)
{
	*streamCount = 4;
	*subtitleCount = 2;

	Stream *streams = new Stream[*streamCount];
	streams[0] = Stream(NULL, NULL, NULL, NULL, NULL, NULL);
	streams[1] = Stream(NULL, "eng", "ass", false, false, NULL);
	streams[2] = Stream(NULL, NULL, NULL, NULL, NULL, NULL);
	streams[3] = Stream(NULL, "fre", "ass", false, false, NULL);

	return streams;
}