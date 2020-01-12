#!/bin/bash

git clone https://github.com/AnonymusRaccoon/Kyoo --recurse
cd Kyoo
git pull --recurse
chmod +x build.sh
./build.sh
dotnet publish -c Release -o /opt/kyoo Kyoo/Kyoo.csproj