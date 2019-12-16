cmake_minimum_required(VERSION 3.15)

set (PROJECT_VERSION "1.0")
project(Kyoo.Transcoder VERSION ${PROJECT_VERSION})

include_directories(ffmpeg)
include_directories(ffmpeg/include)
include_directories(ffmpeg/include/libavcodec)
include_directories(ffmpeg/include/libavdevice)
include_directories(ffmpeg/include/libavfilter)
include_directories(ffmpeg/include/libavformat)
include_directories(ffmpeg/include/libavutil)
include_directories(ffmpeg/include/libpostproc)
include_directories(ffmpeg/include/libswresample)
include_directories(ffmpeg/include/libswscale)
include_directories(include)

add_library(Kyoo.Transcoder SHARED
        src/helper.c
        src/transcoder.c src/subtitles.c)