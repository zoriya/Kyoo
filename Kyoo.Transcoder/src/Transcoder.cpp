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

//Video ScanVideo(std::string path)
//{
//
//}

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

	AVDictionaryEntry* metadata = NULL;

	while ((metadata = av_dict_get(formatContext->metadata, "", metadata, AV_DICT_IGNORE_SUFFIX)))
	{
		std::cout << metadata->key << " - " << metadata->value << std::endl;
	}

	avformat_close_input(&formatContext);

	return;
}