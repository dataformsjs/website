#!/usr/bin/env bash

# -----------------------------------------------------------------------------
#
#  This is a Bash Script that runs on the production server [dataformsjs.com]
#  and is used to sync the latest changes from GitHub. It runs manually from
#  the author once published changes are confirmed.
#
#  To run:
#      bash /var/www/dataformsjs-site/scripts/sync-server-from-github.sh
#
#  For testing with [rsync] use [-n = --dry-run]
#  Example:
#      rsync -nrcv --delete ~/dataformsjs-master/examples/ /var/www/html/examples
#
#  When this file is updated the script should first be manually updated
#  on the server to avoid sync issues.
#
#  Additionally reset permissions if there are sync issues:
#      sudo chown ubuntu:www-data -R /var/www
#      sudo chmod 0775 -R /var/www
#
# -----------------------------------------------------------------------------

# Download and Uncompress latest braches from GitHub
wget https://github.com/dataformsjs/dataformsjs/archive/master.zip -O ~/master.zip
unzip -q ~/master.zip
rm ~/master.zip
wget https://github.com/dataformsjs/website/archive/master.zip -O ~/master.zip
unzip -q ~/master.zip
rm ~/master.zip

# The public directory `/var/www/html` is a combination of files from the
# two repositories so re-create the structure from downloaded files before syncing
cp -r ~/website-master/public/ ~/public
rm ~/public/Web.config
cp -r ~/dataformsjs-master/examples/ ~/public/examples
cp -r ~/dataformsjs-master/js/ ~/public/src
cp -r ~/dataformsjs-master/test/ ~/public/unit-testing/
rm ~/public/unit-testing/server.js
rm ~/public/unit-testing/favicon.ico

# Sync
rsync -rcv --delete --exclude node_modules ~/website-master/app/ /var/www/dataformsjs-site/app
rsync -rcv --delete --exclude geonames.sqlite ~/website-master/app_data/ /var/www/dataformsjs-site/app_data
rsync -rcv --delete ~/website-master/scripts/ /var/www/dataformsjs-site/scripts
rsync -rcv --delete ~/public/ /var/www/dataformsjs-site/public

# FastSitePHP Framework Updates are manual only if needed:
# wget https://github.com/fastsitephp/fastsitephp/archive/master.zip -O ~/master.zip
# unzip -q ~/master.zip
# rm ~/master.zip
# rsync -rcv --delete ~/fastsitephp-master/src/ /var/www/vendor/fastsitephp/src
# rm -r ~/fastsitephp-master

# Delete Downloaded Files
rm -r ~/website-master
rm -r ~/dataformsjs-master
rm -r ~/public
