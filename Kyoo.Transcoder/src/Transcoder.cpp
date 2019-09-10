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

void ExtractSubtitles(const char* path)
{
	AVFormatContext* formatContext = NULL;

	if (avformat_open_input(&formatContext, path, NULL, NULL))
	{
		std::cout << "Error: Can't open the file at " << path << std::endl;
		return;
	}

	if (avformat_find_stream_info(formatContext, NULL) < 0)
	{
		std::cout << "Error: Could't find streams informations for the file at " << path << std::endl;
		return;
	}

	for (unsigned int i = 0; i < formatContext->nb_streams; i++)
	{
		AVStream* stream = formatContext->streams[i];
		const AVCodecContext* streamContext = stream->codec;

		if (streamContext->codec_type == AVMEDIA_TYPE_SUBTITLE)
		{
			const AVCodec* dec = streamContext->codec;
			std::cout << "Stream #" << i << ", stream type: " << streamContext->codec_type << " codec: " << dec->long_name << std::endl;
		}
	}

	//const char* outputPath = "subtitle.ass";
	//if (avformat_alloc_output_context2(&formatContext, NULL, NULL, outputPath) < 0)
	//{
	//	std::cout << "Error: Can't create output file at " << outputPath << std::endl;
	//	return;
	//}

	avformat_close_input(&formatContext);

	return;
}