#pragma once
#ifdef TRANSCODER_EXPORTS
#define API __declspec(dllexport)
#else
#define API __declspec(dllimport)
#endif

#include <iostream>
#include "Stream.h"


extern "C" API int Init();

extern "C" API void ExtractSubtitles(const char* path);
