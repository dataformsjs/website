<?php
namespace App\Models;

class WebServiceResult
{
    public static function success(array $data = null)
    {
        $result = ['success' => true];
        if ($data !== null) {
            foreach ($data as $field => $value) {
                $result[$field] = $value;
            }
        }
        return $result;
    }

    public static function error($errorMessage, array $data = null)
    {
        $result = [
            'success' => false,
            'isLoaded' => false,
            'hasError' => true,
            'errorMessage' => $errorMessage,
        ];
        if ($data !== null) {
            foreach ($data as $field => $value) {
                $result[$field] = $value;
            }
        }
        return $result;
    }
}