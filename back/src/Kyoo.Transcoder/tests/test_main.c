//
// Created by anonymus-raccoon on 12/28/19.
//

#include <string.h>
#include <stdio.h>
#include "transcoder.h"
#include "stream.h"

const char *type_tostring(type t)
{
	switch (t) {
	case video:
		return "Video";
	case audio:
		return "Audio";
	case subtitle:
		return "Subtitle";
	case attachment:
		return "Attachment";
	default:
		return "???";
	}
}

void av_dic_dump(AVDictionary *dic)
{
	AVDictionaryEntry *entry = NULL;

	if (!dic)
		return;
	while ((entry = av_dict_get(dic, "", entry, AV_DICT_IGNORE_SUFFIX)))
		printf("%s: %s\n", entry->key, entry->value);
	printf("Done\n");
	fflush(stdout);
}


int main(int argc, char **argv)
{
	unsigned stream_count = 0;
	unsigned track_count = 0;
	float playable_duration;
	stream *streams;

	// Useless reference only to have the function on the binary to call it with a debugger.
	av_dic_dump(NULL);

	if ((argc == 3 || argc == 4) && !strcmp(argv[1], "info")) {
		streams = extract_infos(argv[2], argv[3] ? argv[3] : "./Extra", &stream_count, &track_count, true);
		puts("Info extracted:");
		for (unsigned i = 0; i < track_count; i++) {
			printf("%10s: %6s - %3s (%5s), D%d, F%d at %s\n",
				type_tostring(streams[i].type),
				streams[i].title,
				streams[i].language != NULL ? streams[i].language : "X",
				streams[i].codec,
				streams[i].is_default,
				streams[i].is_forced,
				streams[i].path);
		}
		free_streams(streams, stream_count);
		return 0;
	}
	else if (argc == 4 && !strcmp(argv[1], "transmux"))
		return -transmux(argv[2], argv[3], &playable_duration);
	else
		printf("Usage:\n\
	%s info video_path - Test info prober\n\
	%s transmux video_path m3u8_output_file - Test transmuxing\n", argv[0], argv[0]);
	return 0;
}
