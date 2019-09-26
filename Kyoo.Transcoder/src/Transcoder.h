#pragma once
#ifdef TRANSCODER_EXPORTS
#define API __declspec(dllexport)
#else
#define API __declspec(dllimport)
#endif

#include <iostream>
#include "Stream.h"


extern "C" API int Init();

extern "C" API int Transmux(const char *path, const char *outPath);

//Take the path of the file and the path of the output directory. It will return the list of subtitle streams in the streams variable. The int returned is the number of subtitles extracted.
extern "C" API Stream* ExtractSubtitles(const char *path, const char *outPath, int *streamCount, int *subtitleCount);

extern "C" API void FreeMemory(Stream *streamsPtr);

extern "C" API Stream* TestMemory(const char *path, const char *outPath, int *streamCount, int *subtitleCount);
