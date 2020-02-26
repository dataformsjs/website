<?php

use FastSitePHP\Web\Response;

/**
 * Unit Test Routes for Runnig Unit Tests on the main server.
 * 
 * This is the PHP version of the node tests:
 *     https://github.com/dataformsjs/dataformsjs/blob/master/test/server.js
 */

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