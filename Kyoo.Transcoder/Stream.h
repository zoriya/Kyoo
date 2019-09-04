#pragma once
#ifdef TRANSCODER_EXPORTS
#define API __declspec(dllexport)
#else
#define API __declspec(dllimport)
#endif

#include <iostream>

extern "C" API struct Video
{
	std::string title;
	Audio* audios;
	Subtitle* subtitles;
	long duration;
};

extern "C" API struct Audio
{
	std::string title;
	std::string languageCode;
};

extern "C" API struct Subtitle
{
	std::string title;
	std::string languageCode;
};