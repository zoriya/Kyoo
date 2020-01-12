#!/bin/bash

if [[ $(/usr/bin/id -u) -ne 0 ]]; then
    echo "The script must be run as root since it create an user for kyoo and install the app inside the /opt folder."
    exit
fi

git clone https://github.com/AnonymusRaccoon/Kyoo --recurse
cd Kyoo
git pull --recurse
chmod +x build.sh
./build.sh
dotnet publish -c Release -o /opt/kyoo Kyoo/Kyoo.csproj
useradd -rU kyoo
chown -R kyoo /opt/kyoo
chgrp -R kyoo /opt/kyoo
chmod +x /opt/kyoo/kyoo.sh
