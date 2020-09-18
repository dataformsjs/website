<?php
namespace App\Controllers;

use App\Models\LoremIpsum;
use App\Models\WebServiceResult;
use FastSitePHP\Application;
use FastSitePHP\Data\Validator;
use FastSitePHP\Web\Request;

/**
 * Controller class that handles the Entry Form Demo page.
 * The Entry Form Demo allows for each user to work with their own
 * records based on a randomly generated API key.
 * 
 * Prior to using this class the API key will be assigned to the app object.
 * 
 * In general public functions in this class return PHP Arrays which
 * are then returned as JSON objects.
 */
class EntryForm
{
    /**
     * Maximum number of records allowed per user
     */
    private const MAX_RECORDS = 50;

    /**
     * Categories are hard-coded to keep the demo simple.
     * In common relational database design and code these 
     * values would exist as records in a seperate table.
     */
    private const CATEGORIES = ['Lorem', 'Ipsum', 'Dolor', 'Sit', 'Amet'];

    /**
     * Generate a Random API Key and some Test data for use with the entry-form demos.
     * This allows each user to only see and edit there own records.
     *
     * @param Application $app
     * @return array
     */
    public function generateKey(Application $app)
    {
        $bytes = random_bytes(16);
        $api_key = bin2hex($bytes);
        $this->addExampleRecords($app, $api_key);
        return ['key' => $api_key];
    }
    
    /**
     * Return all categories and not other records. This is used
     * when for adding new records.
     * 
     * @return array
     */
    public function getCategories()
    {
        return [ 'categories' => self::CATEGORIES ];
    }

    /**
     * Generate sample records for the user. If the user deletes all records then a
     * button will show up allowing the URL to call this service.
     *
     * @param Application $app
     * @return array
     */
    public function generateSampleData(Application $app)
    {
        $api_key = $app->locals['api_key'];

        // Prevent user from adding too many records
        $error = $this->validateUserRecordCount($app, $api_key);
        if ($error) {
            return $error;
        }

        // Insert and return all records for the user
        $this->addExampleRecords($app, $api_key);
        return $this->getRecordList($app);
    }

    /**
     * Check number of records for the user and return an error if the limit is reached.
     * This should be called prior to adding new records.
     *
     * @param Application $app
     * @param string $api_key
     * @return array|null
     */
    private function validateUserRecordCount(Application $app, $api_key)
    {
        $count = $app->entryFormDb->queryValue('SELECT COUNT(*) FROM records WHERE api_key = ?', [$api_key]);
        if ($count >= self::MAX_RECORDS) {
            $error = 'Error, only %d records can be added per user. To add more records delete some first.';
            $error = sprintf($error, self::MAX_RECORDS);
            return WebServiceResult::error($error);
        }
        return null; // Valid
    }

    /**
     * Add Sample/Test records for use with the entry-form demos.
     *
     * @param Application $app
     * @param string $api_key
     */
    private function addExampleRecords(Application $app, $api_key)
    {
        $categories = self::CATEGORIES;
        $cat_count = count($categories) - 1;
        $sql = 'INSERT INTO records (api_key, label, num_value, category, active, date_value, comment) VALUES (?, ?, ?, ?, ?, ?, ?)';
        $date_value = date('Y-m-d', time());
        $app->entryFormDb->executeMany($sql, [
            [$api_key, LoremIpsum::text(15), rand(0, 1000), $categories[rand(0, $cat_count)], 1, $date_value, LoremIpsum::text()],
            [$api_key, LoremIpsum::text(15), rand(0, 1000), $categories[rand(0, $cat_count)], 1, $date_value, LoremIpsum::text()],
            [$api_key, LoremIpsum::text(15), rand(0, 1000), $categories[rand(0, $cat_count)], 1, $date_value, LoremIpsum::text()],
        ]);
    }

    /**
     * Return an array of records for the user along with categories
     * which can be used for the drop-down list.
     * @param Application $app
     * @return array
     */
    public function getRecordList(Application $app)
    {
        $api_key = $app->locals['api_key'];
        $sql = 'SELECT * FROM records WHERE api_key = ? ORDER BY id LIMIT ' . (string)self::MAX_RECORDS;
        $records = $app->entryFormDb->query($sql, [$api_key]);
        return [
            'records' => $records,
            'categories' => self::CATEGORIES,
        ];
    }

    /**
     * Return a record for the user
     * @param Application $app
     * @param int|string $id
     * @return array
     */
    public function getRecord(Application $app, $id)
    {
        $api_key = $app->locals['api_key'];
        $sql = 'SELECT * FROM records WHERE id = ? AND api_key = ?';
        $record = $app->entryFormDb->queryOne($sql, [$id, $api_key]);
        if ($record === null) {
            return WebServiceResult::error('Record not found. It was deleted while you had the page open.');
        }
        $record['categories'] = self::CATEGORIES; // Include for <select> control
        return $record;
    }

    /**
     * Insert a new record or update changes.
     * The record is read from a JSON Post.
     *
     * @param Application $app
     * @return array
     */
    public function save(Application $app)
    {
        // Get Record from Request
        $req = new Request();
        $record = $req->content();

        // Validate Request
        $v = $this->getValidator();
        list($errors, $fields) = $v->validate($record);
        if ($errors) {
            $error = implode(' ', $errors);
            return WebServiceResult::error($error);
        }
        
        // Limit number of records per user if adding a new record
        $api_key = $app->locals['api_key'];
        $is_new_record = !isset($record['id']);
        if ($is_new_record) {
            $error = $this->validateUserRecordCount($app, $api_key);
            if ($error) {
                return $error;
            }
        }

        // Save Record
        // Check and return result, if a new record was added then return the inserted Id
        $rows_affected = $this->saveRecord($app, $record, $api_key);
        if ($rows_affected === 1) {
            if ($is_new_record) {
                return WebServiceResult::success([
                    'fields' => ['id' => $app->entryFormDb->lastInsertId()],
                ]);
            }
            return WebServiceResult::success();
        }
        if ($rows_affected === 0) {
            $error = 'Unable to save record. It was deleted while you had the page open.';
        } else {
            $error = 'Error unexpected result saving record. Rows affected: ' . $rows_affected;
        }
        return WebServiceResult::error($error);
    }

    /**
     * Save all records for the user. This gets called from the [Edit All]
     * screen and records are read from a JSON Post.
     *
     * @param Application $app
     * @return array
     */
    public function saveAll(Application $app)
    {
        // Read API Key and Records from Request
        $req = new Request();
        $records = $req->content()['records'];

        // Limit number of records per user
        if (count($records) >= self::MAX_RECORDS) {
            $error = 'Error, only %d records can be saved per user. Try saving fewer records.';
            $error = sprintf($error, self::MAX_RECORDS);
            return WebServiceResult::error($error);
        }

        // Validate Records
        // Records are validated through JavaScript so this would only
        // happen if something is wrong with client-side validation.
        $error_count = 0;
        $all_errors = [];
        $v = $this->getValidator();
        foreach ($records as $record) {
            list($errors, $fields) = $v->validate($record);
            if ($errors) {
                $error_count++;
                $all_errors += $errors;
            }
        }
        if ($error_count > 0) {
            $error = 'Error, unable to save because %d record(s) could not be validated. Please fix errors before saving. Errors: %s';
            $error = sprintf($error, $error_count, implode(', ', $all_errors));
            return WebServiceResult::error($error);
        }

        // Query for existing records
        $api_key = $app->locals['api_key'];
        $exiting_records = $this->getRecordList($app)['records'];

        // Process all records
        $rows_updated = 0;
        $rows_added = 0;
        $record_ids = [];
        foreach ($records as $record) {
            // Check if new record
            $is_new_record = !isset($record['id']);
            if (!$is_new_record) {
                // Keep track of record ID's
                $record_ids[] = $record['id'];

                // Update record only if different from db
                $was_found = false;
                $has_changes = false;

                foreach ($exiting_records as $exiting) {
                    if ((int)$exiting['id'] === (int)$record['id']) {
                        $was_found = true;
                        $fields = ['label', 'num_value', 'comment', 'category', 'active', 'date_value'];
                        foreach ($fields as $field) {
                            if ($exiting[$field] !== $record[$field]) {
                                $has_changes = true;
                                break;
                            }
                        }
                        break;
                    }
                }

                if (!$has_changes) {
                    continue;
                }

                // Because this is a demo app records may end up deleted while the user
                // has the screen open. If that happens simply add the record as a new one.
                if (!$was_found) {
                    unset($record['id']);
                    $is_new_record = true;
                }
            }

            // Save (Insert or Update) and verify that the transaction was successful
            $rows_affected = $this->saveRecord($app, $record, $api_key);
            if ($rows_affected !== 1) {
                $error = 'Error unexpected result saving record. Rows affected: %d, Record: %s';
                $error = sprintf($error, $rows_affected, json_encode($record));
                return WebServiceResult::error($error);
            }

            // Keep track of added records
            if ($is_new_record) {
                $record_ids[] = $app->entryFormDb->lastInsertId();
                $rows_added++;
            } else {
                $rows_updated++;
            }
        }

        // Delete any existing record that was not submitted with the request
        $sql = 'DELETE FROM records WHERE api_key = ?';
        $params = [$api_key];
        if (count($record_ids) > 0) {
            $placeholders = array_fill(0, count($record_ids), '?');
            $sql .= ' AND id NOT IN (' . implode(', ', $placeholders) . ')';
            foreach ($record_ids as $id) {
                $params[] = $id;
            }
        }
        $rows_deleted = $app->entryFormDb->execute($sql, $params);

        // Build a result message for the user
        $result = [];
        $actions = [
            ['count'=>$rows_updated, 'type'=>'Updated'],
            ['count'=>$rows_added,   'type'=>'Added'],
            ['count'=>$rows_deleted, 'type'=>'Deleted'],
        ];
        foreach ($actions as $action) {
            if ($action['count'] > 0) {
                $plural = ($action['count'] === 1 ? '' : 's');
                $result[] = sprintf('%s %d record%s', $action['type'], $action['count'], $plural);
            }
        }
        switch (count($result)) {
            case 0:
                $result = 'No changes made';
                break;
            case 1:
                $result = $result[0];
                break;
            case 2:
                $result = implode(' and ', $result);
                break;
            default:
                $result = sprintf('%s, %s, and %s', $result[0], strtolower($result[1]), strtolower($result[2]));
                break;
        }

        // Re-query and return result and all records for the user
        $response = WebServiceResult::success([
            'result' => $result,
            'fields' => $this->getRecordList($app),
        ]);
        return $response;
    }

    /**
     * Delete a record for the user
     * @param Application $app
     * @param int|string $id
     * @return array
     */
    public function delete(Application $app, $id)
    {
        try {
            $api_key = $app->locals['api_key'];
            $sql = 'DELETE FROM records WHERE id = ? AND api_key = ?';
            $app->entryFormDb->execute($sql, [$id, $api_key]);
            return WebServiceResult::success();
        } catch (\Exception $e) {
            return WebServiceResult::error($e->getMessage());
        }
    }

    /**
     * Build a list of rules with a Validator Object for saving records.
     * @return Validator
     */
    private function getValidator()
    {
        $v = new Validator();
        $v->addRules([
            ['label',       'Label',    'required'],
            ['num_value',   'Number',   'exists type=number'],
            ['comment',     'Comment',  'exists'],
        ]);
        return $v;
    }

    /**
     * Save a record (INSERT or UPDATE) and return number of rows
     * affected by the action query.
     *
     * @param Application $app
     * @param array $record
     * @param string $api_key
     * @return int
     */
    private function saveRecord(Application $app, $record, $api_key)
    {
        // Build Insert or Update Query
        $insert = false;
        if (isset($record['id'])) {
            $sql = 'UPDATE records SET label = :label, num_value = :num_value, category = :category, active = :active, date_value = :date_value, comment = :comment WHERE id = :id AND api_key = :api_key';
        } else {
            $sql = 'INSERT INTO records (api_key, label, num_value, category, active, date_value, comment) VALUES (:api_key, :label, :num_value, :category, :active, :date_value, :comment)';
            $insert = true;
            // Remove key to prevent errors with extra keys for parameterized query
            if (array_key_exists('id', $record)) {
                unset($record['id']);
            }
        }

        // Save Record
        $record['api_key'] = $api_key;
        $rows_affected = $app->entryFormDb->execute($sql, $record);
        return $rows_affected;
    }
}