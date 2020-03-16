<?php
namespace App\Controllers;

use App\Models\ExampleCode;
use FastSitePHP\Application;

/**
 * Controller for URL 'docs/:lang/quick-reference'
 */
class QuickReference
{
    /**
     * JSON Service to return example code based on selected language
     *
     * @param Application $app
     * @param string $lang
     */
    public function get(Application $app, $lang)
    {
        $example = new ExampleCode($lang);
        $code = $example->getCode();
        return [ 'code' => $code ];
    }
}