#pragma once
#ifdef TRANSCODER_EXPORTS
#define API __declspec(dllexport)
#else
#define API __declspec(dllimport)
#endif

#include <iostream>

extern "C" struct Stream
{
	const char* title;
	const char* language;
	const char* codec;
	bool isDefault;
	bool isForced;
	const char* path;

	Stream(const char* title, const char* languageCode, const char* codec, bool isDefault, bool isForced, const char* path)
	: title(title), language(languageCode), codec(codec), isDefault(isDefault), isForced(isForced), path(path) { }
};