<?php
namespace App\Middleware;

use FastSitePHP\Application;
use FastSitePHP\Web\Request;

class Auth
{
    /**
     * Auth for Entry Form Demo [entry-form-demo-hbs.htm].
     * 
     * Check for Request Header [Authorization] for an API key which for this app
     * is simply a hexadecimal string 32 characters in length (16 bytes). The key
     * does not have to be created ahead of time; since this is a demo site only
     * the format must be valid. The key will be assigned to the app object.
     * 
     * @param Application $app
     * @throws \Exception
     */
    public function requireApiKey(Application $app)
    {
        // Read Key from Auth Header
        // OPTIONS requests will not contain the header
        $req = new Request();
        if ($req->method() === 'OPTIONS') {
            return;
        } else {
            $api_key = $req->header('Authorization');
            if ($api_key === null) {
                throw new \Exception('Missing Request Header [Authorization]');
            }
        }

        // Check Format
        $api_key = str_replace('Bearer ', '', $api_key);
        if (strlen($api_key) !== 32 || !ctype_xdigit($api_key)) {
            throw new \Exception('Invalid Data submitted with Request Header [Authorization]. Clear browser local storage or cache for this page to reset the key.');
        }

        // Assign to App
        $app->locals['api_key'] = $api_key;
    }
}