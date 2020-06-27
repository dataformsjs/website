<?php
namespace App\Controllers;

use FastSitePHP\Application;
use App\Models\WebServiceResult;

/**
 * Controller that queries a SQLite database of Geonames Data.
 * http://www.geonames.org/
 * 
 * To use this class the database must be created locally using
 * one of the following scripts:
 *     app_data/scripts/geonames.py
 *     app_data/scripts/geonames.rb
 */
class Geonames
{
    public function getCountries(Application $app)
    {
        $sql = $app->getSql('geonames-countries.sql');
        if (isset($_GET['order_by']) && $_GET['order_by'] === 'country') {
            $sql = str_replace('population DESC,', '', $sql);
        }
        $records = $app->geonames->query($sql);
        return ['countries' => $records];
    }

    public function getRegions(Application $app, $country)
    {
        $sql = $app->getSql('geonames-admin1-by-country.sql');
        $records = $app->geonames->query($sql, [$country]);
        return ['regions' => $records];
    }

    public function getCities(Application $app, $country, $region)
    {
        $sql = $app->getSql('geonames-20-largest-cities-in-admin1.sql');
        $records = $app->geonames->query($sql, [$country, $region]);
        return ['cities' => $records];
    }

    public function getPlace(Application $app, $id)
    {
        $sql = 'SELECT * FROM geonames WHERE geonames_id = ?';
        $record = $app->geonames->queryOne($sql, [$id]);
        if ($record['alternate_names']) {
            $record['alternate_names'] = explode(',', $record['alternate_names']);
        }
        return ['place' => $record];
    }

    public function search(Application $app)
    {
        // Query String Params
        $country = $_GET['country'] ?? null;
        $city = $_GET['city'] ?? null;
        if ($city === null || trim($city) === '') {
            return WebServiceResult::error('[City] is a required search option.');
        }

        // Query Db
        $sql = $app->getSql('geonames-search.sql');
        $records = $app->geonames->query($sql, [':country_code'=>trim($country), ':name'=>trim($city)]);
        return ['cities' => $records];
    }
}