<?php
namespace App\Controllers;

use FastSitePHP\Application;

/**
 * Controller for working with AI/ML Web Services.
 * This controller returns sample data and categories.
 * 
 * AI/ML Prediction Web Service are handled by a Python Server.
 * The Python code uses a lot of CPU so it is handled from another
 * server to avoid using too many resources on the main server.
 * 
 * Python Code is located in: [Website\app\app.py]
 */
class AI_ML
{
    // If running [app.py] locally use [127.0.0.1:5000] or change the value to point
    // to your own server if you setup a prediction server.
    //
    // const PREDICTION_SERVER = 'http://127.0.0.1:5000/predict/';
    const PREDICTION_SERVER = 'https://ai-ml.dataformsjs.com/predict/';

    const ERROR_UNKNOWN_MODEL = 'Requested model is not handled by this web service.';

    /**
     * Return a sample data for the inital page. Values are simply hard-coded based
     * on the predicted result if testing manually.
     * 
     * URL: '/data/ai-ml/sample-data/:model'
     * 
     * @param Application $app
     * @param string $model
     * @return array JSON Response
     */
    public function sampleData(Application $app, $model) {
        if ($model === 'resnet50') {
            return [
                'images' => [
                    [
                        'src' => 'https://d2xbd92kui7v97.cloudfront.net/img/ai-ml-examples/dog-pomeranian-mikey-on-sofa-600x600.jpg',
                        'predictions' => [
                            ['wordnet'=>'n02112018',   'label'=>'Pomeranian',   'probability'=>0.9434830546379089],
                        ],
                    ],
                    [
                        'src' => 'https://d2xbd92kui7v97.cloudfront.net/img/ai-ml-examples/panda-jay-wennington-s-fD5Tpew2k-unsplash-300x450.jpg',
                        'predictions' => [
                            ['wordnet'=>'n02510455',   'label'=>'giant_panda',   'probability'=>0.9999071359634399],
                        ],
                    ],
                    [
                        'src' => 'https://d2xbd92kui7v97.cloudfront.net/img/ai-ml-examples/skiing-samuel-ferrara-FGEHnEMaZnE-unsplash-448x448.jpg',
                        'predictions' => [
                            ['wordnet'=>'n04228054',   'label'=>'ski',   'probability'=>0.8419132232666016],
                            ['wordnet'=>'n09193705',   'label'=>'apl',   'probability'=>0.1525856852531433],
                        ],
                    ],
                ],
                // URL/Server for Image Prediction
                'predictUrl' => self::PREDICTION_SERVER . 'resnet50',
            ];
        } else if ($model === 'pima-indians-diabetes') {
            return [
                // Fields
                'pregnancies' => 7,
                'glucose' => 195,
                'bloodPressure' => 70,
                'skinThickness' => 33,
                'insulin' => 145,
                'bmi' => 25.1,
                'diabetesPedigreeFunction' => 0.163,
                'age' => 55,
                // AI/ML Prediction Results
                'prediction' => 1,
                'probability' => 0.8163113066280706,
                // URL/Server for Image Prediction
                // [saveUrl] is a standard property on [entryForm.js]
                'saveUrl' => self::PREDICTION_SERVER . 'pima-indians-diabetes',
            ];
        }
        throw new \Exception(self::ERROR_UNKNOWN_MODEL);
    }

    /**
     * Return a list of categories used by a model. Currently this applies
     * only to the Image Classification Demo. Runs in PHP code instead of
     * Python to avoid delays while the Python Server is making predictions.
     * For example a user can start predicting images, click to the categories
     * page and see all categories load while images are still being predicted
     * in the background.
     * 
     * For source info see [Website\app_data\ai-ml\sources.txt]
     * 
     * URL: '/data/ai-ml/categories/:model'
     * 
     * @param Application $app
     * @param string $model
     * @return array JSON Response
     */
    public function categories(Application $app, $model) {
        if ($model === 'resnet50') {
            $path = $app->config['APP_DATA'] . 'ai-ml/imagenet_class_index.json';
            $list = json_decode(file_get_contents($path), true);
            $categories = [];
            foreach ($list as $item) {
                $categories[] = $item[1];
            }
            return ['categories' => $categories];
        }
        throw new \Exception(self::ERROR_UNKNOWN_MODEL);
    }

    /**
     * Return a sample training data, this is used to show users what
     * the data looks like that was used to create the model.
     * 
     * URL: '/data/ai-ml/sample-training-data/:model'
     * 
     * @param Application $app
     * @param string $model
     * @return array JSON Response
     */
    public function sampleTrainingData(Application $app, $model) {
        if ($model === 'pima-indians-diabetes') {
            return [
                'columns' => ['Pregnancies', 'Glucose', 'Blood Pressure', 'Skin Thickness', 'Insulin', 'BMI', 'Diabetes Pedigree Function', 'Age', 'Has Diabetes'],
                'records' => [
                    [1,89,66,23,94,28.1,0.167,21,0],
                    [2,197,70,45,543,30.5,0.158,53,1],
                    [1,189,60,23,846,30.1,0.398,59,1],
                    [5,166,72,19,175,25.8,0.587,51,1],
                    [1,103,30,38,83,43.3,0.183,33,0],
                    [1,115,70,30,96,34.6,0.529,32,1],
                    [3,126,88,41,235,39.3,0.704,27,0],
                    [0,118,84,47,230,45.8,0.551,31,1],
                    [1,103,30,38,83,43.3,0.183,33,0],
                    [13,145,82,19,110,22.2,0.245,57,0],
                ],
            ];
        }
        throw new \Exception(self::ERROR_UNKNOWN_MODEL);
    }
}
