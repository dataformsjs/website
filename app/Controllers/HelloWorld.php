<?php

namespace App\Controllers;

use FastSitePHP\Application;
use FastSitePHP\FileSystem\Security;
use FastSitePHP\Lang\I18N;
use FastSitePHP\Web\Response;

class HelloWorld
{
    /**
     * Return Hello World Example Pages.
     *
     * To keep hello world files simple (when viewing source from a browser)
     * the js plugin [i18n] is not used, rather the content of the file is updated
     * using find/replace with i18n key values before sending to the client.
     */
    public function get(Application $app, $lang, $file)
    {
        // Get Root Path for Examples
        $root = __DIR__ . '/../../html/examples/hello-world'; // Server
        if (!is_dir($root)) {
            $root = __DIR__ . '/../../../dataformsjs/examples/hello-world'; // Local development
        }

        // Make sure file exists and get file type
        if (!Security::dirContainsFile($root, $file)) {
            return $app->pageNotFound();
        }
        $is_html_file = (strpos($file, '.htm') !== false);
        $file_path = $root . '/' . $file;

        // CSS or SVG file
        if (!$is_html_file) {
            $res = new Response($app);
            return $res->file($file_path);
        }

        // HTML File
        // 1) First read the i18n file: [dataformsjs\examples\i18n\hello-world.{lang}.json]
        $i18n_file = $root . '/../i18n/hello-world.{lang}.json';
        $i18n = I18N::textFile($i18n_file, $lang);
        $i18n = json_decode($i18n, false);
        if ($i18n === null) {
            throw new \Exception('Error decoding file: ' . $i18n_file);
        }
        $i18n->lang = $lang;

        // 2) Read html file: [dataformsjs\examples\hello-world\{file}]
        $html = file_get_contents($file_path);

        // 3) Replace all i18n keys in the file
        foreach ($i18n as $key => $value) {
            $html = str_replace('{{' . $key . '}}', $value, $html);
        }

        // 4) return HTML content
        return $html;
    }
}
