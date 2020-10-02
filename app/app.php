<?php

// ------------------------------------------------------------------
// Classes used in this file. Classes are not loaded unless used.
// ------------------------------------------------------------------

use FastSitePHP\FileSystem\Security;
use FastSitePHP\Lang\I18N;
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

// Some routes use server-side I18N functions.
// Use FastSitePHP's i18n API for this.
// It uses the same format '_.{lang}.json' as DataFormsJS.
// This is in a seperate function to avoid unnecessary [is_dir()]
// calls for routes that do not need server-side i18n.
$use_i18n = function() use ($app) {
    $dir = __DIR__ . '/../html/i18n';
    if (!is_dir($dir)) {
        // Local development
        $dir = __DIR__ . '/../public/i18n';
    }
    $app->config['I18N_DIR'] = $dir;
};

//------------------------------------------------------------
// Define Routes
//------------------------------------------------------------

/**
 * Root URL, redirect to the user's default language based the 'Accept-Language'
 * request header. Defaults to 'en = English' if no language is matched.
 *
 * For example if the user's default language is Spanish then they will be
 * redirected to '/es/'.
 *
 * The response header [Vary: Accept-Language] is used for Content
 * negotiation to let bots know that the content will change based
 * on language. For example this applies to Googlebot and Bingbot.
 */
$app->get('/', function() use ($app) {
    $res = new Response();
    return $res
        ->vary('Accept-Language')
        ->redirect('/' . I18n::getUserDefaultLang() . '/');
})
->filter($use_i18n);

/**
 * Load route files if the requested URL matches.
 */
$app->mount('/data', 'routes-data.php');
$app->mount('/graphql', 'routes-graphql.php');
$app->mount('/unit-testing', 'routes-test.php');

/**
 * Additional routes
 */
$app->get('/docs/:lang/quick-reference', 'QuickReference');
$app->get('/examples/hello-world/:lang/:file', 'HelloWorld');
$app->get('/examples/hello-world/en-js.htm', function() use ($app) {
    // Redirect for previously published URL
    return $app->redirect('/examples/hello-world/en/js.htm');
});

/**
 * If user comes from [~/examples/] or [~/examples] then
 * redirect to the main SPA examples page in their default language.
 * 
 * Typically this would happen if they view an example then
 * manually update the URL in the browser. If this route is not
 * included a 404 page would be returned.
 */
$app->get('/examples', function() use ($app) {
    $res = new Response();
    return $res
        ->vary('Accept-Language')
        ->redirect('/' . I18n::getUserDefaultLang() . '/examples');
})->filter($use_i18n);

/**
 * Test for the 500 error page
 */
$app->get('/500', function() {
    throw new \Exception('Example Error');
});

/**
 * Show PHP Version and Server Info, runs on localhost only
 */
$app->get('/phpinfo', function() {
    phpinfo();
})
->filter($is_localhost);

/**
 * Home Page and HTML5 History Routes handled by JavaScript.
 * These routes are defined after other routes such as ['/graphql']
 * so that ['/:lang'] does not get matched to them.
 */
$app_html = function($lang) use ($use_i18n, $app, $is_localhost) {
    // In local development root files such as [favicon.ico] will be mapped to '/:lang'.
    // Skip the route if the request is for a file, otherwise a 500 response will be
    // returned from `I18N::langFile()`.
    if (strpos($app->requestedPath(), '.') !== false && $is_localhost()) {
        return;
    }

    // Calling [I18N::langFile] with an unknown language
    // will result in a 404 page being sent to the client.
    $use_i18n();
    I18N::langFile('_', $lang);

    // Return the main web page [index.htm].
    $app->noCache();
    return file_get_contents(__DIR__ . '/Views/index.htm');
};
$app->get('/:lang', $app_html);
$app->get('/:lang/playground', $app_html);
$app->get('/:lang/getting-started', $app_html);
$app->get('/:lang/quick-reference', $app_html);
$app->get('/:lang/examples', $app_html);

/**
 * Allow static resources on the server to be downloaded using CORS.
 * For example this allows sites like CodePen to access HTML Temlates
 * from the Example Apps.
 */
$app->get('/examples/cors/:dir/:file', function($dir, $file) use ($app) {
    // Get Directory, first check if running from production server (Ubuntu)
    $root = __DIR__ . '/../html/examples';
    if (!is_dir($root)) {
        // Local Dev Path
        $root = __DIR__ . '/../../dataformsjs/examples';
    }

    // Security Check to prevent Path Traversal Attacks
    if (!Security::dirContainsDir($root, $dir)) {
        return $app->pageNotFound();
    }
    $root_dir = $root . '/' . $dir;
    if (!Security::dirContainsFile($root_dir, $file)) {
        return $app->pageNotFound();
    }

    // Return file; passing [$app] to the Response Object
    // allows for CORS headers to be used.
    $res = new Response($app);
    return $res->file($root_dir . '/' . $file);
});

/**
 * Fallback URL for local development, all other files are
 * pulled directly from the DataFormsJS Framework examples.
 *
 * On the production server the needed files are copied.
 * See server setup in [docs\Main Site Server Setup.txt].
 *
 * This route doesn't run on the live server due to the
 * filter for `$is_localhost`.
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
    // var_dump($path);
    // exit();

    // Unit Tests routes have different mapping so they work from node
    // in the main repository, from server, and from here
    if (strpos($path, '/src/') === 0) {
        $path = '/js/' . substr($path, 5);
    } elseif (strpos($path, '/unit-testing/') === 0) {
        $path = '/test/' . substr($path, strlen('/unit-testing/'));
    }

    // Security check since [$path] comes from User Input. Although
    // this only runs in localhost using secure code is good practice.
    if (!Security::dirContainsPath($root, $path)) {
        // Site is likely running with the PHP built-in server using [index.php] as
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
