//
// Created by Anonymus Raccoon on 16/12/2019.
//

#pragma once

#include <stdio.h>

#ifdef __WIN32__
	#define mkdir(c, m) mkdir(c)
#endif

#ifdef __MINGW32__
	#define asprintf __mingw_asprintf
#endif