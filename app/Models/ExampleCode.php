<?php
namespace App\Models;

use FastSitePHP\Lang\I18N;

/**
 * Model for Example Code which is used in Quick Reference pages.
 * In the future as additional documentation and example pages are created
 * this model can be used by them as well.
 */
class ExampleCode
{
    private $code_text = null;
    private $code_list = null;

    /**
     * Class Constructor
     * @param string $lang
     */
    function __construct($lang)
    {
        $this->readFile($lang);
        $this->parseCode($this->code_text);
    }

    /**
     * Return Array of Code Objects (\stdClass) parsed from the loaded and parsed file.
     * @return array
     */
    public function getCode()
    {
        return $this->code_list;
    }

    /**
     * Read an example code file based on the user's selected language
     * @param string $lang
     */
    public function readFile($lang)
    {
        $file_path = __DIR__ . '/../../app_data/example-code/quick-reference-{lang}.htm';
        $this->code_text = I18N::textFile($file_path, $lang);
    }

    /**
     * Parse code blocks as an array of objects from a simple example code file
     * @param array $code
     */
    public function parseCode($code)
    {
        // Split code based on specific comments to seperate related
        // code, then remove first section before start of code.
        $code_blocks = explode('<!-- EXAMPLE_CODE_START', $code);
        array_splice($code_blocks, 0, 1);

        // Process each block of code
        $example_code = array();
        foreach ($code_blocks as $code) {
            // Remove code after the end of the example
            $pos = strpos($code, '<!-- EXAMPLE_CODE_END -->');
            $code = substr($code, 0, $pos);

            // Normalize line endings [CRLF -> LF]
            $code = str_replace("\r\n", "\n", $code);

            // Split to an array on new lines and remove
            // the first item as it will be blank.
            $code = explode("\n", trim($code));
            //array_splice($code, 0, 1);

            // Get attributes and remove the attribute lines
            // Currently this code requires attributes to be
            // defined in the order listed below.
            $attr = [
                'title' => null,
                'lang' => 'html',
            ];
            $search = [
                'title' => 'TITLE: ',
                'lang' => 'LANG: ',
            ];
            foreach ($search as $key => $value) {
                if (strpos($code[0], $value) === 0) {
                    $attr[$key] = trim(substr($code[0], strlen($value)));
                    array_splice($code, 0, 1);
                } else {
                    break;
                }
            }

            if (trim($code[0]) === '-->') {
                array_splice($code, 0, 1);
            }

            // Updates for specific languages
            if ($attr['lang'] === 'JavaScript') {
                if (trim($code[0]) === '<script>' && trim($code[count($code)-1]) === '</script>') {
                    array_splice($code, 0, 1);
                    array_pop($code);
                }
            } elseif ($attr['lang'] === 'JSX') {
                if (trim($code[0]) === '<script type="text/babel">' && trim($code[count($code)-1]) === '</script>') {
                    array_splice($code, 0, 1);
                    array_pop($code);
                }
            }

            // Join lines back to a string
            $code = implode("\n", $code);

            // Add to array
            $obj = new \stdClass;
            $obj->title = $attr['title'];
            $obj->lang = strtolower($attr['lang']);
            $obj->code = trim($code);
            $example_code[] = $obj;
        }
        $this->code_list = $example_code;
    }
}
