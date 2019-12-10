<?php
// This script is used to generate i18n translation files needed for adding a new language.
//
// Run from the command line locally:
//     php create-i18n-files.php
//
// Or run with a Code Editor if supported (example for Visual Studio Code):
//     https://www.fastsitephp.com/en/documents/edit-with-vs-code
//
// This script requires a local setup of 3 repositories and is safe to run multiple times
// as it will not overwite existing files.
//
// See Online docs for full details:
//     https://github.com/dataformsjs/dataformsjs/blob/master/docs/i18n-translations.md

// **** MODIFY here to add a new Language ****
const LANG_COPY_FROM = 'en';
const LANG_COPY_TO = 'jp';

// *** Additional Options ***/
const COPY_QUICK_REF = true;

// In case autoloader is not found or unexpected error:
error_reporting(-1);
ini_set('display_errors', 'on');

// PHP Autoloader (dynamically load classes)
include __DIR__ . '/../vendor/autoload.php';

// -----------------------------------------------------------------
// Validate Folders and Downloaded Repositories
// -----------------------------------------------------------------

$root_dir = realpath(__DIR__ . '/../../');
if (basename($root_dir) !== 'dataformsjs') {
    echo 'Error - Unexpected file structure, this repository should be under a root [dataformsjs] dir.' . PHP_EOL;
    exit();
}

// Check for [https://github.com/dataformsjs/dataformsjs]
$dataformsjs_dir = $root_dir . '/dataformsjs/examples/i18n';
if (LANG_COPY_FROM === 'en') {
    $dataformsjs_readme_from = $root_dir . '/dataformsjs/README.md';
} else {
    $dataformsjs_readme_from = $root_dir . '/dataformsjs/docs/i18n-readme/README.' . LANG_COPY_FROM . '.md';
}
$dataformsjs_readme_to = $root_dir . '/dataformsjs/docs/i18n-readme/README.' . LANG_COPY_TO . '.md';
if (!is_dir($dataformsjs_dir)) {
    echo 'Error - Missing [dataformsjs] repository.' . PHP_EOL;
    echo $dataformsjs_dir . PHP_EOL;
    exit();
} else if (!is_file($dataformsjs_readme_from)) {
    echo 'Error - Missing [dataformsjs] readme file to copy from.' . PHP_EOL;
    echo $dataformsjs_readme_from . PHP_EOL;
    exit();
}

// Check for [https://github.com/dataformsjs/playground]
$playground_dir_from = $root_dir . '/playground/app_data/template/' . LANG_COPY_FROM;
$playground_dir_to = $root_dir . '/playground/app_data/template/' . LANG_COPY_TO;
if (!is_dir($playground_dir_from)) {
    echo 'Error - Missing [playground] template' . PHP_EOL;
    echo $playground_dir_from . PHP_EOL;
    exit();
}

// -----------------------------------------------------------------
// Copy Files
// -----------------------------------------------------------------

$checked_files = [];
$copied_files = [];

// JSON Files
$search = new \FastSitePHP\FileSystem\Search();
$files = $search
    ->dir($dataformsjs_dir)
    ->fileTypes(['json'])
    ->includeRegExNames(['/.' . LANG_COPY_FROM . '.json$/'])
    ->fullPath(true)
    ->files();

$web_files = $search
    ->dir($root_dir . '/website/public/i18n')
    ->files();

$all_files = array_merge($files, $web_files);
foreach ($all_files as $file) {
    $find = '.' . LANG_COPY_FROM . '.json';
    $replace = '.' . LANG_COPY_TO . '.json';
    $dest = str_replace($find, $replace, $file);
    $checked_files[] = $dest;
    if (!is_file($dest)) {
        copy($file, $dest);
        $copied_files[] = $dest; 
    }
}

// Readme File
$checked_files[] = $dataformsjs_readme_from;
if (!is_file($dataformsjs_readme_to)) {
    copy($dataformsjs_readme_from, $dataformsjs_readme_to);
    $copied_files[] = $dataformsjs_readme_to;
}

// Optional Quick Ref Code
if (COPY_QUICK_REF) {
    $quick_ref_from = $root_dir . '/website/app_data/example-code/quick-reference-' . LANG_COPY_FROM . '.htm';
    $quick_ref_to = $root_dir . '/website/app_data/example-code/quick-reference-' . LANG_COPY_TO . '.htm';
    $checked_files[] = $quick_ref_from;
    if (!is_file($quick_ref_to)) {
        copy($quick_ref_from, $quick_ref_to);
        $copied_files[] = $quick_ref_to;
    }
}

// Playground Template
if (!is_dir($playground_dir_to)) {
    mkdir($playground_dir_to);
}

$files = $search
    ->reset()
    ->dir($playground_dir_from)
    ->fileTypes(['htm', 'css', 'js', 'jsx', 'svg', 'graphql'])
    ->fullPath(true)
    ->files();

foreach ($files as $file) {
    $find = DIRECTORY_SEPARATOR . LANG_COPY_FROM . DIRECTORY_SEPARATOR;
    $replace = DIRECTORY_SEPARATOR . LANG_COPY_TO . DIRECTORY_SEPARATOR;
    $dest = str_replace($find, $replace, $file);
    $checked_files[] = $dest;
    if (!is_file($dest)) {
        copy($file, $dest);
        $copied_files[] = $dest; 
    }
}
    
// Show Results
echo 'Files Checked: ' . count($checked_files) . PHP_EOL;
echo 'Files Copied:' . count($copied_files) . PHP_EOL;
if ($copied_files) {
    echo 'New Files:' . PHP_EOL;
    foreach ($copied_files as $file) {
        echo $file . PHP_EOL;
    }    
}
