<?php

// ------------------------------------------------------------------
// Classes used in this file. Classes are not loaded unless used.
// ------------------------------------------------------------------

use FastSitePHP\FileSystem\Security;
use FastSitePHP\Web\Request;
use FastSitePHP\Web\Response;

//------------------------------------------------------------
// Site Config and Filter Functions
//------------------------------------------------------------

// General Application Settings
$app->controller_root = 'App\Controllers';
$app->middleware_root = 'App\Middleware';
$app->template_dir = __DIR__ . '/Views';
$app->not_found_template = '404.htm';
$app->error_template = 'error.php';
$app->show_detailed_errors = true;

// Translation Settings with [FastSitePHP\Lang\I18N]
$app->config['I18N_FALLBACK_LANG'] = 'en';

// Misc settings for this site
$app->config['APP_DATA'] = __DIR__ . '/../app_data/';

// Use CORS to allow web pages to access this service from any host (URL)
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== 'null') {
    $app->cors([
        'Access-Control-Allow-Origin' => $_SERVER['HTTP_ORIGIN'],
        'Access-Control-Allow-Headers' => 'Authorization, Content-Type',
        'Access-Control-Allow-Credentials' => 'true',
    ]);
} else {
    $app->cors('*');
}

// Routes using this filter will only work when both
// client and server are localhost [127.0.0.1] or [::1]
// and the host being used is 'localhost' or 'localhost:*'.
$is_localhost = function() {
    // Quick check to avoid creating an un-needed object
    $is_localhost = (
        isset($_SERVER['HTTP_HOST'])
        && ($_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], 'localhost:') === 0)
    );
    // Full check for security, if the site were behind a
    // load balancer then the above code could return [true],
    // so an actual IP check is needed.
    if ($is_localhost) {
        $req = new Request();
        $is_localhost = $req->isLocal();
    }
    return $is_localhost;
};

//------------------------------------------------------------
// Define Routes
//------------------------------------------------------------

/**
 * Home Page, simply return the contents of [index.htm]
 */
$app->get('/', function() use ($app) {
    $contains_index_php = (strpos($app->rootUrl(), 'index.php') !== false);
    if ($contains_index_php) {
        $app->redirect('/');
    }
    return file_get_contents(__DIR__ . '/Views/index.htm');
});


/**
 * Additional Routes
 */
$app->get('/docs/:lang/quick-reference', 'QuickReference');


/**
 * Load additional route files if the requested URL matches.
 */
$app->mount('/data', 'routes-data.php');
$app->mount('/graphql', 'routes-graphql.php');


/**
 * Hello World Examples
 */
$app->get('/examples/hello-world/:lang/:file', 'HelloWorld');
$app->get('/examples/hello-world/en-js.htm', function() use ($app) {
    // Redirect for previously published URL
    return $app->redirect('/examples/hello-world/en/js.htm');
});


/**
 * Test for the 500 error page
 */
$app->get('/500', function() {
    throw new \Exception('Example Error');
});


/**
 * Show PHP Version and Server Info
 */
$app->get('/phpinfo', function() {
    phpinfo();
})
->filter($is_localhost);


/**
 * Fallback URL for local development, all other files are
 * pulled directly from the DataFormsJS Framework examples.
 *
 * On the production server the files are copied.
 */
$app->get('/*', function() use ($app) {
    // Path for DataFormsJS Repository; this assumes the Repository
    // exists in the same directory as the  Website Repository.
    // Change if needed for local development.
    $root = __DIR__ . '/../../dataformsjs';
    $path = $app->requestedPath();

    // To replicate slow pages uncomment and modify the following as needed.
    // This causes a delay in all non-js files.
    //
    // if (strpos($path, '.js') === false) {
    //     usleep(500000);
    // }
    
    // Uncomment to debug if needed (also version below)
    // var_dump($root . $path);
    // exit();

    // Security check since [$path] comes from User Input. Although
    // this only runs in localhost using secure code is good practice.
    if (!Security::dirContainsPath($root, $path)) {
        // Site is likley running with the PHP built-in server using [index.php] as
        // the router. All requests will go here so check for public site files.
        $root = __DIR__ . '/../public';
        // var_dump($root . $path);
        // exit();
        if (!Security::dirContainsPath($root, $path)) {
            return $app->pageNotFound();
        }
    }

    // Return file; passing [$app] to the Response Object
    // allows for CORS headers to be used.
    $res = new Response($app);
    return $res->file($root . $path);
})
->filter($is_localhost);
