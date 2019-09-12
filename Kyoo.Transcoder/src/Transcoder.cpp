#include "pch.h"
#include "Transcoder.h"

//ffmpeg imports
extern "C"
{
	#include <libavformat/avformat.h>
	#include <libavutil/dict.h>
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

	for (unsigned int i = 0; i < inputContext->nb_streams; i++)
	{
		AVStream* inputStream = inputContext->streams[i];
		const AVCodecParameters* inputCodecpar = inputStream->codecpar;

		if (inputCodecpar->codec_type == AVMEDIA_TYPE_SUBTITLE)
		{
			const char* output = outPath;
			const AVCodec* codec = avcodec_find_decoder(inputCodecpar->codec_id);
			std::cout << "Stream #" << i << ", stream type: " << inputCodecpar->codec_type << " codec: " << codec->name << " long name: " << codec->long_name << std::endl;

			AVFormatContext* outputContext = NULL;
			if (avformat_alloc_output_context2(&outputContext, NULL, NULL, output) < 0)
			{
				std::cout << "Error: Couldn't create an output file." << std::endl;
				continue;
			}

			AVStream* outputStream = avformat_new_stream(outputContext, codec);
			if (outputStream == NULL)
			{
				std::cout << "Error: Couldn't create stream." << std::endl;
				avformat_free_context(outputContext);
				return;
			}

			AVCodecParameters* outputCodecpar = outputStream->codecpar;
			avcodec_parameters_copy(outputCodecpar, inputCodecpar);

			//outputStream->disposition = inputStream->disposition;

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

			if (avio_open(&outputContext->pb, output, AVIO_FLAG_WRITE) < 0)
			{
				std::cout << "Error: Couldn't open file at " << output << std::endl;
				avformat_free_context(outputContext);
				return;
			}

			if (avformat_write_header(outputContext, NULL) < 0)
			{
				std::cout << "Error: Couldn't write headers to file at " << output << std::endl;
				avformat_free_context(outputContext);
				avio_closep(&outputContext->pb);
				return;
			}

			AVPacket pkt;
			int i = 0;
			while (av_read_frame(inputContext, &pkt) == 0)
			{
				if (pkt.stream_index != inputStream->index)
					continue;

				std::cout << "Reading packet... " << i << std::endl;
				i++;

				pkt.pts = av_rescale_q_rnd(pkt.pts, inputStream->time_base, outputStream->time_base, AV_ROUND_NEAR_INF);
				pkt.dts = av_rescale_q_rnd(pkt.dts, inputStream->time_base, outputStream->time_base, AV_ROUND_NEAR_INF);
				pkt.duration = av_rescale_q(pkt.duration, inputStream->time_base, outputStream->time_base);
				pkt.pos = -1;
				pkt.stream_index = 0;

				if (av_interleaved_write_frame(outputContext, &pkt) < 0)
				{
					//Should handle packet copy error;
				}

				av_packet_unref(&pkt);
			}
			av_write_trailer(outputContext);

			avio_closep(&outputContext->pb);
			avformat_free_context(outputContext);

			goto end;
		}
	}

end:
	avformat_close_input(&inputContext);
	return;
}