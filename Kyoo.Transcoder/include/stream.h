#pragma once
#include <iostream>
#include <sstream>

extern "C" struct Stream
{
	char *title;
	char *language;
	char *codec;
	bool is_default;
	bool is_forced;
	char *path;

	Stream()
		: title(nullptr), language(nullptr), codec(nullptr), is_default(nullptr), is_forced(nullptr), path(nullptr) {}

	Stream(const char* title, const char* languageCode, const char* codec, bool isDefault, bool isForced)
		: title(nullptr), language(nullptr), codec(nullptr), is_default(isDefault), is_forced(isForced), path(nullptr)
	{
		if(title != nullptr)
			this->title= strdup(title);

		if (languageCode != nullptr)
			language = strdup(languageCode);
		else
			language = strdup("und");

		if (codec != nullptr)
			this->codec = strdup(codec);
	}

	Stream(const char *title, const char *languageCode, const char *codec, bool isDefault, bool isForced, const char *path)
		: title(nullptr), language(nullptr), codec(nullptr), is_default(isDefault), is_forced(isForced), path(nullptr)
	{
		if (title != nullptr)
			this->title = strdup(title);

		if (languageCode != nullptr)
			language = strdup(languageCode);
		else
			language = strdup("und");

		if (codec != nullptr)
			this->codec = strdup(codec);

		if (path != nullptr)
			this->path = strdup(path);
	}
};