//
// Created by Zoe Roux on 2019-12-29.
//

#pragma once

/**
 * A function that return a newly allocated string containing the filename
 * without the extension of a path.
 *
 * @param path The path of the file to get the name for.
 * @return The name of the the file without the extension
 * @warning The returned string is malloced and should be freed after use.
 */
char *path_getfilename(const char *path);

/**
 * Get the extension that should be used for a specific codec.
 *
 * @param codec The name of the codec to get the extension for.
 * @return A read only string containing the extension to use for the given
 *         codec or NULL if the codec is not known.
 */
char *get_extension_from_codec(char *codec);

/**
 * Create a new directory at the given path, if the directory already exists,
 * do nothing and succeed.
 *
 * @param path The path of the directory to create
 * @param mode The permissions flags (unused on windows)
 * @return 0 if the directory was created without fail, the error code of mkdir otherwise
 *         (-1 and the errno set appropriately).
 */
int path_mkdir(const char *path, int mode);

/**
 * Create a new directory and create parent directories if needed. If the whole
 * path tree already exists, do nothing and succeed.
 *
 * @param path The path of the directory to create.
 * @param mode The permission flags of new directories (unused on windows)
 * @return 0 if all directory were created without fail, the error code of mkdir otherwise
 *         (-1 and the errno set appropriately).
 */
int path_mkdir_p(const char *path, int mode);