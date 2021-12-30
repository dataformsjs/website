<?php

use FastSitePHP\Web\Response;
use FastSitePHP\FileSystem\Security;

/**
 * Unit Test Routes for Running Unit Tests on the main server.
 *
 * This is the PHP version of the node tests:
 *     https://github.com/dataformsjs/dataformsjs/blob/master/test/server.js
 *
 * Example URL on the main server:
 *     https://www.dataformsjs.com/unit-testing/
 *
 * If running the main site for local development the same URL will be:
 *     http://localhost:3000/unit-testing/
 */

$app->get('/unit-testing', function() {
    $html = '<h1>DataFormsJS Unit Testing</h1><ul>';
    $files = ['handlebars', 'nunjucks', 'underscore', 'mixed-templates', 'vue', 'vue-3', 'react', 'preact'];
    foreach ($files as $file) {
        $html .= '<li><a href="/unit-testing/' . $file . '">' . $file . '</li>';
    }
    $html .= '</ul>';
    return $html;
});

$app->get('/unit-testing/:view', function($view) use ($app) {
    // Production Server location
    $dir = '/var/www/dataformsjs-site/public/unit-testing/views';
    if (!is_dir($dir)) {
        // Local development
        $dir = __DIR__ . '/../../dataformsjs/test/views';
    }
    $file = 'unit-testing-' . $view . '.htm';
    if (Security::dirContainsFile($dir, $file)) {
        return (new Response())->file($dir . '/' . $file);
    } elseif ($view === '404' || $view === 'missing-url.htm') {
        return $app->pageNotFound();
    }
});

$app->get('/unit-testing/page-json-data', function() {
    return (new Response())
        ->header('X-Unit-Test', 'DataFormsJS JSON')
        ->json([ 'serverMessage' => 'Response from Server' ]);
});

$app->get('/unit-testing/page-json-data-error', function() {
    return [
        'isLoaded' => false,
        'hasError' => true,
        'errorMessage' => 'Error Message set from Server',
    ];
});

$app->get('/unit-testing/plain-text', function() {
    return (new Response())
        ->contentType('text')
        ->header('X-Unit-Test', 'DataFormsJS Text')
        ->content('Text Response from Server');
});

$app->get('/unit-testing/page-json-data-record/:id', function($id) {
    return [ 'recordId' => $id ];
});