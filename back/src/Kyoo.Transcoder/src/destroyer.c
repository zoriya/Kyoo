//
// Created by anonymus-raccoon on 12/29/19.
//

#include "stream.h"
#include "export.h"
#include <stdlib.h>

API void destroy_stream(stream *s)
{
	free(s->title);
	free(s->language);
	free(s->codec);
	free(s->path);
}

API void free_streams(stream *s, unsigned count)
{
	for (unsigned i = 0; i < count; i++)
		destroy_stream(s + i);
	free(s);
}
