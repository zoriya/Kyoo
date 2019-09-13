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
	return 42;
}

void ExtractSubtitles(const char* path, const char* outPath)
{
	AVFormatContext* inputContext = NULL;

	if (avformat_open_input(&inputContext, path, NULL, NULL))
	{
		std::cout << "Error: Can't open the file at " << path << std::endl;
		return;
	}

	if (avformat_find_stream_info(inputContext, NULL) < 0)
	{
		std::cout << "Error: Could't find streams informations for the file at " << path << std::endl;
		return;
	}

	av_dump_format(inputContext, 0, path, false);

	const unsigned int outputCount = inputContext->nb_streams;
	AVFormatContext** outputList = new AVFormatContext*[outputCount];

	//Initialize output and set headers.
	for (unsigned int i = 0; i < inputContext->nb_streams; i++)
	{
		AVStream* inputStream = inputContext->streams[i];
		const AVCodecParameters* inputCodecpar = inputStream->codecpar;

		if (inputCodecpar->codec_type != AVMEDIA_TYPE_SUBTITLE)
			outputList[i] = NULL;
		else
		{
			//Get metadata for file name
			const char* language = av_dict_get(inputStream->metadata, "language", NULL, 0)->value;

			std::cout << "Stream #" << i << "(" << language << "), stream type: " << inputCodecpar->codec_type << " codec: " << inputCodecpar->codec_tag << std::endl;

			//Create output folder
			std::stringstream outStream;
			outStream << outPath << (char)std::filesystem::path::preferred_separator << language;
			std::filesystem::create_directory(outStream.str());
			
			//Get file name
			std::string fileName(path);
			size_t lastSeparator = fileName.find_last_of((char)std::filesystem::path::preferred_separator);
			fileName = fileName.substr(lastSeparator, fileName.find_last_of('.') - lastSeparator);

			//Construct output file name
			outStream << fileName << "." << language;
			outStream << ".ass";
			std::string outStr = outStream.str();
			const char* output = outStr.c_str();

			AVFormatContext* outputContext = NULL;
			if (avformat_alloc_output_context2(&outputContext, NULL, NULL, output) < 0)
			{
				std::cout << "Error: Couldn't create an output file." << std::endl;
				continue;
			}

			av_dict_copy(&outputContext->metadata, inputContext->metadata, NULL);

			AVStream* outputStream = avformat_new_stream(outputContext, NULL);
			if (outputStream == NULL)
			{
				std::cout << "Error: Couldn't create stream." << std::endl;
				goto end;
			}

			if (avcodec_parameters_copy(outputStream->codecpar, inputCodecpar) < 0)
			{
				std::cout << "Error: Couldn't copy parameters to the output file." << std::endl;
				goto end;
			}
			outputStream->codecpar->codec_tag = 0;

			avformat_transfer_internal_stream_timing_info(outputContext->oformat, outputStream, inputStream, AVTimebaseSource::AVFMT_TBCF_AUTO);
			outputStream->time_base = av_add_q(av_stream_get_codec_timebase(outputStream), AVRational { 0, 1 });
			outputStream->duration = av_rescale_q(inputStream->duration, inputStream->time_base, outputStream->time_base);
			outputStream->disposition = inputStream->disposition;

			av_dict_copy(&outputStream->metadata, inputStream->metadata, NULL);

			//if (inputStream->nb_side_data)
			//{
			//	for (int i = 0; i < inputStream->nb_side_data; i++)
			//	{
			//		std::cout << "Copying side packet #" << i << std::endl;

			//		AVPacketSideData* sidePkt = &inputStream->side_data[i];
			//		uint8_t* newPkt = av_stream_new_side_data(outputStream, sidePkt->type, sidePkt->size);
			//		if (newPkt == NULL)
			//		{
			//			std::cout << "Error copying side package." << std::endl;
			//			//Should handle return here
			//			return;
			//		}
			//		memcpy(newPkt, sidePkt->data, sidePkt->size);
			//	}
			//}

			av_dump_format(outputContext, 0, output, true);

			if (!(outputContext->flags & AVFMT_NOFILE))
			{
				if (avio_open(&outputContext->pb, output, AVIO_FLAG_WRITE) < 0)
				{
					std::cout << "Error: Couldn't open file at " << output << std::endl;
					goto end;
				}
			}
			else
				std::cout << "Output flag set to AVFMT_NOFILE." << std::endl;

			if (avformat_write_header(outputContext, NULL) < 0)
			{
				std::cout << "Error: Couldn't write headers to file at " << output << std::endl;
				goto end;
			}

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

		AVFormatContext* outputContext = outputList[pkt.stream_index];
		if(outputContext == nullptr)
		{
			av_packet_unref(&pkt);
			continue;
		}

		AVStream* inputStream = inputContext->streams[pkt.stream_index];
		AVStream* outputStream = outputContext->streams[0];

		pkt.stream_index = 0;

		pkt.pts = av_rescale_q_rnd(pkt.pts, inputStream->time_base, outputStream->time_base, AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX);
		pkt.dts = av_rescale_q_rnd(pkt.dts, inputStream->time_base, outputStream->time_base, AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX);
		pkt.duration = av_rescale_q(pkt.duration, inputStream->time_base, outputStream->time_base);
		pkt.pos = -1;

		if (av_interleaved_write_frame(outputContext, &pkt) < 0)
		{
			std::cout << "Error while writing a packet to the output file." << std::endl;
		}

		av_packet_unref(&pkt);
	}

	avformat_close_input(&inputContext);

	for (unsigned int i = 0; i < outputCount; i++)
	{
		AVFormatContext* outputContext = outputList[i];

		if (outputContext == NULL)
			continue;

		av_write_trailer(outputContext);

		if (outputContext && !(outputContext->flags & AVFMT_NOFILE))
			avio_closep(&outputContext->pb);
		avformat_free_context(outputContext);
	}

	delete[] outputList;
}