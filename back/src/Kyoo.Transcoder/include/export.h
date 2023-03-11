//
// Created by Anonymus Raccoon on 15/12/2019.
//

#pragma once

#if defined _WIN32 || defined __CYGWIN__
	#define API __declspec(dllexport)
#elif defined __GNUC__
	#define API __attribute__((unused))
#else
	#define API
#endif
