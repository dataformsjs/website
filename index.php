<?php

// This file is intended to be run from a development environment and simply
// redirects to the [public] directory which would be used as the
// public root directory on a web server.

// 1) Install Dependencies (PHP is required)
//      cd {this-directory}
//      php ./scripts/install.php
//
// 2) To run from a command line or terminal program using the PHP Built-in Webserver
//    you can use the following:
//      cd {root-directory}
//      php -S localhost:3000 website/public/index.php
//
//    This assumes that you have both [dataformsjs] and [website] Repositories
//    and are running from the root folder. If running directly from this folder
//    then change the path of the router page:
//        php -S localhost:3000 public/index.php
//
// 2) Alternative (run only this site without the [dataformsjs] repository)
//    This runs the main site SPA but does not include examples or allow for local
//    development of the main Framework and Component JS files.
//      cd {this-directory}
//      php -S localhost:3000
//
// 3) Then open your web browser to:
//      http://localhost:3000/

header('Location: public/');
