# Kyoo.Transcoder

A C library using FFMPEG (libav) to process videos files for kyoo.

## Features
 - Return streams informations (language, title, codec, arrangement)
 - Extract subtitles, fonts & chapters to an external file
 - Transmux to hls (TODO support multi-audio)

## Building

To build this library, you will need a cmake compatible environment. If you are on linux, you can simply use cmake, make and gcc.
Simply run ```mkdir -p build; cd build; cmake ..; make -j``` and it will create a libtranscoder.so file.

If you are on windows, I haven't tested the build process yet. It should work with minimal modification.
