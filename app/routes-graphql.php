<?php

use FastSitePHP\Net\HttpClient;
use FastSitePHP\Web\Request;

/**
 * Run GraphQL Queries from a NodeJS service on localhost.
 * This requires node to be setup and for [app.js] to be running.
 *
 * Example URL's:
 *   https://www.dataformsjs.com/graphql?query={countries{iso,country}}
 *   https://www.dataformsjs.com/graphql?query=query($country:String!){regions(country:$country){name}}&variables={"country":"US"}
 */
$app->route('/graphql', function() {
    try {
        $url = 'http://localhost:4000/graphql';

        // If an 'Authorization' Request Header was
        // sent then pass it to the GraphQL Service.
        $req = new Request();
        $auth = $req->header('Authorization');
        $headers = ($auth === null ? null : ['Authorization' => $auth]);

        // Submit GraphQL Request
        if ($req->method() === 'GET') {
            $url .= '?query=' . urlencode($req->queryString('query'));
            $url .= '&variables=' . urlencode($req->queryString('variables'));
            $url .= '&operationName=' . urlencode($req->queryString('operationName'));
            $res = HttpClient::get($url, $headers);
        } else {
            $res = HttpClient::postJson(
                $url,
                $req->content(),
                $headers
            );
        }

        // Check Response, an error typically would occur not for data
        // errors but rather HTTP errors (i.e.: If the service is down).
        if ($res->error) {
            throw new \Exception($res->error);
        }

        // Return Object for JSON Response
        return $res->json;
    } catch (\Exception $e) {
        // Return unexpected error as a 200 response
        // using standard error format used by GraphQL.
        return [
            'errors' => [
                ['message' => $e->getMessage()]
            ],
        ];
    }
});
