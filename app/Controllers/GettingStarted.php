<?php

namespace App\Controllers;

use FastSitePHP\Application;
use FastSitePHP\FileSystem\Security;
use FastSitePHP\Lang\I18N;
use FastSitePHP\Web\Response;

class GettingStarted
{
    /**
     * Return Getting Started Templates.
     *
     * The getting started page uses JavaScript to combine I18N keys and HTML
     * source to generate the page. This works well client side because all
     * content can be cached in memory so there is no or minimal delay when
     * toggling between templates or languages. However this did not work
     * well with the [View Template] button. Previously a hack using a blank
     * page with an iframe and data URL was used. This route was created so
     * that the templates can be generated server side which makes for a
     * better experience for the end user as the links can be shared and there
     * are no browser issues.
     */
    public function get(Application $app, $lang, $file)
    {
        // Get Root Path for Examples
        $root = __DIR__ . '/../../html/html/getting-started'; // Server
        if (!is_dir($root)) {
            $root = __DIR__ . '/../../public/html/getting-started'; // Local development
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
        // 1) First read the needed i18n JSON files using FastSitePHP I18N API
        //    https://www.fastsitephp.com/en/api/Lang_I18N
        $app->config['I18N_DIR'] = $root . '/../../i18n';
        $app->config['I18N_FALLBACK_LANG'] = 'en';
        I18N::langFile('getting-started', $lang);
        $i18n = $app->locals['i18n'];

        // 2) Read html file
        $html = file_get_contents($file_path);

        // 3) Replace all i18n keys in the file
        foreach ($i18n as $key => $value) {
            $html = str_replace('[[i18n ' . $key . ']]', $value, $html);
        }

        // 4) return HTML content
        return $html;
    }
}
