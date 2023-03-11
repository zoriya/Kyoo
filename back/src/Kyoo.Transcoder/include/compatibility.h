//
// Created by Anonymus Raccoon on 16/12/2019.
//

#pragma once

#if defined(_WIN32) || defined(WIN32)
	#define _CRT_SECURE_NO_WARNINGS
	#define _CRT_NONSTDC_NO_DEPRECATE


	#include <io.h>
	#include <direct.h>
	#include <stddef.h>
	#include <stdarg.h>

	#pragma warning(disable : 5105)
	#include <windows.h>
	#define PATH_MAX MAX_PATH

	char *strndup(const char *str, size_t count);
	int asprintf(char **buffer, const char *fmt, ...);
	int vasprintf(char **buffer, const char *fmt, va_list args);

	#define S_ISDIR(x) ((x) & S_IFDIR)
#else
	#define _GNU_SOURCE

	#include <unistd.h>
#endif

#include <stdio.h>
