<?php

// This file is used to encode HTML files under [DataFormsJS\Website\public\html\home\*]
// to encoded HTML. The encoded HTML has additional markup added for the home page.
//
// This file runs manually from CLI or IDE.

// Show and report on all errors
set_time_limit(0);
error_reporting(-1);
ini_set('display_errors', 'on');

// Process files only if not yet processed. To re-process, delete the "*.htm" file
$files = [
    'example-hello-world-hbs',
    'example-hello-world-web',
    'example-hello-world-js',
    'example-hello-world-react',
    'example-json-data-hbs',
    'example-json-data-vue',
    'example-json-data-react',
    'example-json-data-graphql',
    'example-json-data-web',
];
foreach ($files as $file) {
    $in_file = __DIR__ . '/../public/html/home/' . $file . '.txt';
    $out_file = __DIR__ . '/../public/html/home/' . $file . '.htm';

    if (!is_file($out_file)) {
        $html = file_get_contents($in_file);
        $encoded = htmlspecialchars($html, ENT_QUOTES, 'UTF-8');
        file_put_contents($out_file, $encoded);
    }
}
