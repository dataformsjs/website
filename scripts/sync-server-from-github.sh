#!/usr/bin/env bash

# -----------------------------------------------------------------------------
#
#  This is a Bash Script that runs on the production server [dataformsjs.com]
#  and is used to sync the latest changes from GitHub. It runs manually from
#  the author once published changes are confirmed.
#
#  To run:
#      bash /var/www/scripts/sync-server-from-github.sh
#
#  For testing with [rsync] use [-n = --dry-run]
#  Example:
#      rsync -nrcv --delete ~/dataformsjs-master/examples/ /var/www/html/examples
#
# -----------------------------------------------------------------------------

wget https://github.com/dataformsjs/dataformsjs/archive/master.zip -O /home/ubuntu/master.zip
unzip -q master.zip
rm master.zip
wget https://github.com/dataformsjs/website/archive/master.zip -O /home/ubuntu/master.zip
unzip -q master.zip
rm master.zip
rsync -rcv --delete ~/dataformsjs-master/examples/ /var/www/html/examples
rsync -rcv --delete --exclude node_modules ~/website-master/app/ /var/www/app
rsync -rcv --delete --exclude geonames.sqlite ~/website-master/app_data/ /var/www/app_data
rsync -rcv --delete ~/website-master/scripts/ /var/www/scripts
rsync -rcv --delete --exclude examples --exclude .htaccess ~/website-master/public/ /var/www/html
rm -r website-master
rm -r dataformsjs-master
