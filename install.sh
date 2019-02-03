#!/bin/bash

echo "installing nodejs 10.x"
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
apt-get install -y nodejs
echo "done"


echo "installing node_modules"
npm install
echo "done"

echo "registering pigpiod service"
systemctl enable pigpiod
echo "done"

echo "registering makerplayground service"
cp makerplayground.service /lib/systemd/system/makerplayground.service
systemctl daemon-reload
systemctl enable makerplayground.service
echo "done"
