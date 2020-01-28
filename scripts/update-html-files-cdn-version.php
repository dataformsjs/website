<?php
// This script is used to update all [*.htm] and [*.txt] files with a new CDN version.
// All HTML files (main site, examples, template, etc) are updated to use the most
// recently published npn version from jsdelivr.
//
// Run from the command line locally:
//     php update-html-files-cdn-version.php
//
// Or run directly on the server:
//     php /var/www/scripts/update-html-files-cdn-version.php
//
// This script is copied to both the main sever and playground server.
//
// NOTE - on the main servers the file [sync-server-from-github.sh] is now used
// instead to sync all changes from GitHub.

const CDN = 'https://cdn.jsdelivr.net/npm/dataformsjs@';
const PREV_VER = '3.5.1';
const NEW_VER = '3.5.2';
const SEARCH_TEXT = CDN . PREV_VER;
const REPLACE_TEXT = CDN . NEW_VER;

// PHP Autoloader (dynamically load classes)
include __DIR__ . '/../vendor/autoload.php';

// Get folder location and dir validation.
if (__FILE__ === '/var/www/scripts/update-html-files-cdn-version.php') {
    // Main web server
    $root_dir = '/var/www';
} else {
    $root_dir = realpath(__DIR__ . '/../../');
    if (basename($root_dir) !== 'dataformsjs') {
        print('Error - Unexpected file structure, this repository should be under a root [dataformsjs] dir.');
        exit();
    }    
    $examples_dir = __DIR__ . '/../../dataformsjs/examples';
    if (!is_dir($examples_dir)) {
        print('Error - Missing [dataformsjs] repository.');
        exit();
    }
}

// Search for all files to update
print('Searching Directory: ' . $root_dir . "\n");
$search = new \FastSitePHP\FileSystem\Search();
$files = $search
    ->dir($root_dir)
    ->recursive(true)
    ->fileTypes(['htm', 'txt', 'md'])
    ->includeText([SEARCH_TEXT])
    ->excludeRegExPaths(['/sites/'])
    ->fullPath(true)
    ->files();

print_r($files);
print("\n");

// Update files
foreach ($files as $file) {
    $contents = file_get_contents($file);
    $contents = str_replace(SEARCH_TEXT, REPLACE_TEXT, $contents);
    file_put_contents($file, $contents);
}
print('Updated ' . count($files) . ' files');
print("\n");
