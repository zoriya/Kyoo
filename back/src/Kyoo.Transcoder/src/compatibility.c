//
// Created by Zoe Roux on 2021-04-15.
//

#include "compatibility.h"
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>

#if defined(_WIN32) || defined(WIN32)
char *strndup(const char *str, size_t count)
{
	size_t len = strnlen(str, count);
	char *ret = malloc(sizeof(char) * (len + 1));

	if (!ret)
		return NULL;
	ret[len] = '\0';
	memcpy(ret, str, len);
	return ret;
}

int asprintf(char **buffer, const char *fmt, ...)
{
	va_list args;
	int ret;

	va_start(args, fmt);
	ret = vasprintf(buffer, fmt, args);
	va_end(args);
	return ret;
}

int vasprintf(char **buffer, const char *fmt, va_list args)
{
	va_list copy;
	int len;

	va_copy(copy, args);
	len = _vscprintf(fmt, args);
	va_end(copy);

	*buffer = malloc(sizeof(char) * (len + 1));
	if (!*buffer)
		return -1;
	vsprintf(*buffer, fmt, args);
	return len;
}
#endif