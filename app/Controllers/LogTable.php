<?php
namespace App\Controllers;

use App\Models\LoremIpsum;
use FastSitePHP\Application;

class LogTable
{
    public function get(Application $app, $count)
    {
        // Validate Input
        $count = (int)$count;
        if ($count <= 0 || $count > 200) {
            return [
                'hasError' => true,
                'errorMessage' => 'Error Invalid Count, must be a valid number between 1 and 200.',
                'records' => [],
            ];
        }

        // Create Example Records
        $records = [];
        for ($n = 0; $n < $count; $n++) {
            // Generate a Random Number and Log Level based on the Number
            $value = rand(0, 1000);
            $log_level = 'INFO';
            if ($value > 900) {
                $log_level = 'ERROR';
            } elseif ($value >= 800) {
                $log_level = 'WARNING';
            }

            // Random Placeholder Text
            $text = LoremIpsum::text(); 

            // Add sample data to the array
            $records[] = [
                'values' => [
                    $log_level,
                    $text,
                    $value,
                ],
            ];
        }

        // Simple Oject List format for [DataFormsJS\examples\log-table-web.htm]
        if (isset($_GET['format']) && $_GET['format'] === 'list') {
            $list = [];
            foreach ($records as $record) {
                $list[] = [
                    'Log Level' => $record['values'][0],
                    'Data' => $record['values'][1],
                    'Value' => $record['values'][2],
                ];
            }
            return [
                'records' => $list,
            ];
        }

        // More compact column format used with Hanldebars, React, and Vue Demos
        return [
            'columns' => ['Log Level', 'Data', 'Value'],
            'records' => $records,
        ];
    }
}