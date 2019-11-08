#pragma once
extern "C"
{
	#include <libavformat/avformat.h>
	#include <libavutil/dict.h>
	#include <libavutil/timestamp.h>
}
int open_input_context(AVFormatContext** inputContext, const char* path);
AVStream* copy_stream_to_output(AVFormatContext* out_ctx, AVStream* in_stream);
int open_output_file_for_write(AVFormatContext* out_ctx, const char* out_path);
void process_packet(AVPacket& pkt, AVStream* in_stream, AVStream* out_stream);