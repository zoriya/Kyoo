#pragma once
#ifdef TRANSCODER_EXPORTS
#define API __declspec(dllexport)
#else
#define API __declspec(dllimport)
#endif

#include <iostream>
#include <sstream>

extern "C" struct Stream
{
	char *title;
	char *language;
	char *codec;
	bool isDefault;
	bool isForced;
	char *path;

	Stream()
		: title(NULL), language(NULL), codec(NULL), isDefault(NULL), isForced(NULL), path(NULL) {}

	Stream(const char* title, const char* languageCode, const char* codec, bool isDefault, bool isForced)
		: title(NULL), language(NULL), codec(NULL), isDefault(isDefault), isForced(isForced), path(NULL) 
	{
		if(title != NULL)
			this->title= _strdup(title);

		if (languageCode != NULL)
			language = _strdup(languageCode);
		else
			language = _strdup("und");

		if (codec != NULL)
			this->codec = _strdup(codec);
	}
};