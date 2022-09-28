//
// Created by Zoe Roux on 2019-12-29.
//

#include "compatibility.h"
#include <string.h>
#include <errno.h>
#include <sys/stat.h>
#include <limits.h>
#include <libavutil/log.h>


char *path_getfilename(const char *path)
{
	const char *lastSlash = strrchr(path, '/');
	const char *name = lastSlash ? lastSlash + 1 : path;
	const char *extension = strrchr(path, '.');
	size_t len = extension ? extension - name : 1024;

	return strndup(name, len);
}

char *get_extension_from_codec(char *codec)
{
	if (!codec)
		return NULL;

	if (!strcmp(codec, "subrip"))
		return ".srt";
	if (!strcmp(codec, "ass"))
		return ".ass";
	if (!strcmp(codec, "ttf"))
		return ".ttf";

	av_log(NULL, AV_LOG_ERROR, "Unsupported subtitle codec: %s.\n", codec);
	return NULL;
}

int path_mkdir(const char *path, int mode)
{
	int ret;
	struct stat s;

	if (!path)
		return -1;

#if defined(_WIN32) || defined(WIN32)
	(void)mode;
	ret = mkdir(path);
#else
	ret = mkdir(path, mode);
#endif

	if (ret < 0 && errno == EEXIST && stat(path, &s) == 0) {
		if (S_ISDIR(s.st_mode))
			return 0;
	}
	return ret;
}

int path_mkdir_p(const char *path, int mode)
{
	char buffer[PATH_MAX + 5];
	char *ptr = buffer + 1; // Skipping the first '/'
	int ret;

	strcpy(buffer, path);

	while ((ptr = strchr(ptr, '/'))) {
		*ptr = '\0';
		ret = path_mkdir(buffer, mode);
		if (ret != 0)
			return ret;
		*ptr = '/';
		ptr++;
	}
	return path_mkdir(path, mode);
}