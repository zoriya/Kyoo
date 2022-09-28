cmake_minimum_required(VERSION 3.12)
set(CMAKE_C_STANDARD 11)

set(PROJECT_VERSION "1.0")
project(transcoder VERSION ${PROJECT_VERSION} LANGUAGES C)

add_library(transcoder SHARED 
	src/helper.c
	src/info.c
	src/extractor.c
	src/transmuxer.c
	src/path_helper.c
	src/destroyer.c
	src/compatibility.c
)
set_property(TARGET transcoder PROPERTY C_STANDARD 11)
set_property(TARGET transcoder PROPERTY POSITION_INDEPENDENT_CODE ON)

include_directories(include)
target_link_directories(transcoder PRIVATE ${CMAKE_SOURCE_DIR}/lib)

target_link_libraries(transcoder avformat avcodec avutil)

if(WIN32)
	target_link_libraries(transcoder wsock32 ws2_32)
	target_link_libraries(transcoder Secur32 Secur32)
	target_link_libraries(transcoder Bcrypt Bcrypt)
else()
	target_link_libraries(transcoder m pthread)
endif()

add_executable(test EXCLUDE_FROM_ALL
	tests/test_main.c
)
set_property(TARGET test PROPERTY C_STANDARD 11)
target_link_libraries(test transcoder)
