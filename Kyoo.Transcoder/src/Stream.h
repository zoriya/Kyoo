#pragma once
#ifdef TRANSCODER_EXPORTS
#define API __declspec(dllexport)
#else
#define API __declspec(dllimport)
#endif

#include <iostream>

extern "C" API struct Stream
{
	std::string title;
	std::string languageCode;
	std::string format;
	bool isDefault;
	bool isForced;
	std::string path;
};