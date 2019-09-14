#pragma once
#ifdef TRANSCODER_EXPORTS
#define API __declspec(dllexport)
#else
#define API __declspec(dllimport)
#endif

#include <iostream>

extern "C" struct Stream
{
	std::string title;
	std::string language;
	std::string format;
	bool isDefault;
	bool isForced;
	std::string path;

	Stream(std::string title, std::string languageCode, std::string format, bool isDefault, bool isForced, std::string path)
	: title(title), language(languageCode), format(format), isDefault(isDefault), isForced(isForced), path(path) { }
};