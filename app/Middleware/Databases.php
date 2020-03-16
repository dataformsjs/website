<?php
namespace App\Middleware;

use FastSitePHP\Data\Database;

class Databases
{
    /**
     * Return a connection to the Geonames SQLite database.
     * See [scripts/geonames.py] and [scripts/geonames.rb] for creating the file.
     * 
     * @return Database
     */
    public static function geonames()
    {
        // The geonames database used by this app is large at over 2 GB
        // so if you are testing a local copy of this site and move the copy
        // from computer to computer it makes sense to add it to a custom
        // path for the computer rather than copy it with the site.
        $paths = [
            __DIR__ . '/../../app_data/geonames.sqlite',
            __DIR__ . '/../../../../geonames/geonames.sqlite',
            $_SERVER['DOCUMENT_ROOT'] . '/geonames/geonames.sqlite',
        ];
        foreach ($paths as $path) {
            if (is_file($path)) {
                $dsn = 'sqlite:' . $path;
                return new Database($dsn);
            }
        }
        $error = 'Missing file [geonames.sqlite] check that the file exists and if permissions are set.';
        throw new \Exception($error);
    }

    /**
     * Entry Form Demo SQLite Database
     * 
     * @return Database
     */
    public static function entryFormDb()
    {
        // The SQLite database file will be saved to the temp directory.
        $path = sys_get_temp_dir() . '/example-data-entry.sqlite';

        // Delete the SQLite Database everytime it reaches over 1 gigabyte.
        // It is intended only as a temporary database for this demo page.
        if (is_file($path)) {
            $one_gig = (1024 * 1024 * 1024);
            $file_size = filesize($path);
            if ($file_size > $one_gig) {
                unlink($path);
                // Add to a log file each time it's removed
                $log_path = sys_get_temp_dir() . '/example-data-entry.txt';
                $now = date(DATE_RFC2822);
                $contents = "${path} deleted at ${now}\n";
                file_put_contents($log_path, $contents, FILE_APPEND);
            }
        }

        // Connect and create table and index the first time the db is used
        $dsn = 'sqlite:' . $path;
        $db = new Database($dsn);
        $sql = 'CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY AUTOINCREMENT, api_key TEXT, label TEXT, num_value NUMERIC, category TEXT, active INTEGER, comment TEXT)';
        $db->execute($sql);
        $sql = 'CREATE INDEX IF NOT EXISTS records_api_key ON records (api_key)';
        $db->execute($sql);
        return $db;
    }
}
