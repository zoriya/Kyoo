#pragma once
#include <stdbool.h>
#include <stddef.h>

typedef struct stream
{
	char *title;
	char *language;
	char *codec;
	bool is_default;
	bool is_forced;
	char *path;
} stream;

#define NULLSTREAM (struct stream) { \
	NULL, \
	NULL, \
	NULL, \
	false, \
	false, \
	NULL \
}