<?php

use App\Models\WebServiceResult;
use App\Middleware\Databases;
use FastSitePHP\Web\Response;

// Create an app helper function to load SQL Statements from saved files.
// This makes for easy editing of large and multi-line SQL Statements.
$app->getSql = function($file) {
    return file_get_contents(__DIR__ . '/SQL/' . $file);
};

// Databases are only loaded if used; [lazyLoad] makes them
// properties of the [$app] object (example: $app->geonames).
$app
    ->lazyLoad('geonames', function() { return Databases::geonames(); })
    ->lazyLoad('entryFormDb', function() { return Databases::entryFormDb(); });

// If an error occurs with the entry-form example site then return the error
// in a JSON response with a 200 response status code so the app can handle it.
$app->error(function($response_code, $e) use ($app) {
    if (strpos($app->requestedPath(), '/data/example/entry-form/') !== false) {
        $err = sprintf('Error: %s File: %s, Line: %s', $e->getMessage(), $e->getFile(), $e->getLine());
        $res = new Response($app); // Pass CORS headers from App to Response Object
        $res
            ->json(WebServiceResult::error($err))
            ->send();
        exit();
    }
});

// ------------------------------------
// Routes
// ------------------------------------

$app->get('/data/hello-world', function() {
    // sleep(1);
    // throw new \Exception('Test Error');
    return ['message' => 'Hello World'];
});

$app->get('/data/time', function() {
    return ['time' => date('Y-m-d\TH:i:s', time())];
});

// See controller objects such as [Geonames.php, EntryForm.php, etc]
// under the [Controllers] directory and middleware objects [Auth.php, etc]
// under the [Middleware] directory.

$app->get('/data/geonames/countries', 'Geonames.getCountries');
$app->get('/data/geonames/regions/:country', 'Geonames.getRegions');
$app->get('/data/geonames/cities/:country/:region', 'Geonames.getCities');
$app->get('/data/geonames/place/:id', 'Geonames.getPlace');
$app->get('/data/geonames/search', 'Geonames.search');

$app->get('/data/example/log-table/:count', 'LogTable');

// Entry form demo. Anyone can request [generate-key] however other routes
// requires a valid API key to be passed with the Request.
$app->get('/data/example/entry-form/generate-key', 'EntryForm.generateKey');
$app->get('/data/example/entry-form/categories', 'EntryForm.getCategories')->filter('Auth.requireApiKey');
$app->get('/data/example/entry-form/list', 'EntryForm.getRecordList')->filter('Auth.requireApiKey');
$app->get('/data/example/entry-form/record/:id', 'EntryForm.getRecord')->filter('Auth.requireApiKey');
$app->post('/data/example/entry-form/save', 'EntryForm.save')->filter('Auth.requireApiKey');
$app->post('/data/example/entry-form/save-all', 'EntryForm.saveAll')->filter('Auth.requireApiKey');
$app->post('/data/example/entry-form/delete/:id', 'EntryForm.delete')->filter('Auth.requireApiKey');
$app->post('/data/example/entry-form/generate-sample-data', 'EntryForm.generateSampleData')->filter('Auth.requireApiKey');

// AI/ML Examples
$app->post('/data/ai-ml/predict/:model', 'AI_ML.predict');
$app->get('/data/ai-ml/sample-data/:model', 'AI_ML.sampleData');
$app->get('/data/ai-ml/categories/:model', 'AI_ML.categories');
$app->get('/data/ai-ml/sample-training-data/:model', 'AI_ML.sampleTrainingData');
