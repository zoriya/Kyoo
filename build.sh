#!/bin/bash

# Checking for packages needed to compile the app.
PKG_EXISTS=1
dotnet --version >> /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "FATAL: dotnet could not be found."
    PKG_EXISTS=false
    #Should check if the version is greater of equal to 3.0.100
fi
cmake --version >> /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "FATAL: cmake could not be found."
    PKG_EXISTS=false
fi
gcc -v >> /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "FATAL: gcc could not be found."
    PKG_EXISTS=false
fi
make -v >> /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "FATAL: make could not be found."
    PKG_EXISTS=false
fi
node -v >> /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "FATAL: node could not be found."
    PKG_EXISTS=false
fi
npm -v >> /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "FATAL: npm could not be found."
    PKG_EXISTS=false
fi

if [[ PKG_EXISTS -eq false ]]; then
    echo "Some requiered packages could not be found. Install them and run this script again."
    exit
fi

echo "All packages are here, building the app..."


# Configure ffmpeg.

echo "Building ffmpeg..."
cd transcoder/ffmpeg
if [[ ! -f "config.h" ]]; then
    ./configure --pkg-config-flags=--static --disable-shared --enable-static --disable-zlib --disable-iconv --disable-asm --disable-ffplay --disable-ffprobe --disable-ffmpeg
fi
make
cd ..
echo "Done."

echo "Building the transcoder..."
mkdir --parent build && cd build
cmake ..
make
cd ../..
echo "Done"

echo "Installing the transcoder..."
mv transcoder/build/libtranscoder.so Kyoo/
echo "Installation complete."