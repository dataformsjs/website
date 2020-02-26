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

wget https://github.com/dataformsjs/dataformsjs/archive/master.zip -O ~/master.zip
unzip -q ~/master.zip
rm ~/master.zip
wget https://github.com/dataformsjs/website/archive/master.zip -O ~/master.zip
unzip -q ~/master.zip
rm ~/master.zip
rsync -rcv --delete ~/dataformsjs-master/examples/ /var/www/html/examples
rsync -rcv --delete --exclude node_modules ~/website-master/app/ /var/www/app
rsync -rcv --delete --exclude geonames.sqlite ~/website-master/app_data/ /var/www/app_data
rsync -rcv --delete ~/website-master/scripts/ /var/www/scripts
rsync -rcv --delete --exclude examples --exclude test --exclude .htaccess --exclude Web.config ~/website-master/public/ /var/www/html
rsync -rcv --delete ~/website-master/public/img/examples/. /var/www/html/img/examples

# FastSitePHP Framework Updates are manual only if needed:
# wget https://github.com/fastsitephp/fastsitephp/archive/master.zip -O ~/master.zip
# unzip -q ~/master.zip
# rm ~/master.zip
# rsync -rcv --delete ~/fastsitephp-master/src/ /var/www/vendor/fastsitephp/src
# rm -r ~/fastsitephp-master

# Copy and modify Unit Tests
# This currently overwrites all files each time.
rsync -rcv --delete ~/dataformsjs-master/test/views/. /var/www/html/test
rsync -rcv --delete ~/dataformsjs-master/test/js/. /var/www/html/test/js
rsync -rcv --delete ~/dataformsjs-master/test/html/. /var/www/html/test/html
code=$(cat <<'CODE'
$files = ['handlebars', 'mixed-templates', 'nunjucks', 'preact', 'react', 'underscore'];
foreach ($files as $file) {
    $path = '/var/www/html/test/unit-testing-' . $file . '.htm';
    $content = file_get_contents($path);
    $content = str_replace('src="/js/', 'src="js/', $content);
    $content = str_replace('src="src/', 'src="https://cdn.jsdelivr.net/npm/dataformsjs@3.6.2/js/', $content);
    $content = str_replace('data-url="unit-testing/', 'data-url="/unit-testing/', $content);
    file_put_contents($path, $content);
}
CODE
)
php -r "$code"

# Delete Downloaded Files
rm -r ~/website-master
rm -r ~/dataformsjs-master
