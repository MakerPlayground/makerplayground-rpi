#!/bin/bash

echo "installing nodejs 12.x"
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
apt-get install -y nodejs
echo "done"

echo "installing node_modules"
npm install
echo "done"

echo "installing python's libraries"
pip3 install -U -r requirements.txt
echo "done"

echo "registering pigpiod service"
systemctl enable pigpiod
echo "done"

echo "registering makerplayground service"
cp makerplayground.service /lib/systemd/system/makerplayground.service
systemctl daemon-reload
systemctl enable makerplayground.service
echo "done"
