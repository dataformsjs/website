<?php

// This file is intended to be run from a development environment and simply
// redirects to the [public] directory which would be used as the
// public root directory on a web server.

// To run from a command line or terminal program using the PHP Built-in Webserver
// you can use the following:
//     cd {root-directory}
//     php -S localhost:3000 Website/public/index.php
//
// Then open your web browser to:
//     http://localhost:3000/
//
// This assumes that you have both [DataFormsJS] and [Website] Repositories
// and are running from the root folder. If running directly from this folder
// then change the path of the router page:
//     php -S localhost:3000 public/index.php

header('Location: public/');
