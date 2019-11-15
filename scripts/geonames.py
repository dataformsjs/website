"""
    Import Geonames Data
    Author: Conrad Sollitt

    This is a one-time script that creates a SQLite Database using downloaded
    data from Geonames. Geonames data is tab-delimited without a column
    seperator and a number of records contain Quotes Characters ["] in
    the data. SQLite can import most records from cli using the commands
    listed below, however it fails on records with quotes. This script
    successfully imports all records because it ignores quotes and it can
    be easily modified as needed for different indexes, column names, etc.

    sqlite3 geonames.sqlite
    CREATE TABLE geonames (...
    .mode tabs
    .import allCountries.txt geonames
    .exit

    Links:
    http://www.geonames.org/
    http://download.geonames.org/export/dump/
        From the above link download [allCountries.zip] and [countryInfo.txt].
        Unzip [allCountries.zip] prior to running this script.
    http://download.geonames.org/export/dump/readme.txt
    https://www.sqlite.org/index.html

    This script is expected to take about 3 to 5 minutes to run.

    Expected Results:
    Added 252 Records to [countries] Table
    Added 11768184 Records to [geonames] Table
    Success Database Created
"""
import os
import sqlite3

# File Settings
CUR_DIR = os.path.dirname(__file__)
PLACES_FILE = 'allCountries.txt'
COUNTRIES_FILE = 'countryInfo.txt'

# Save to a sperate [app_data] dir or simply hard-code a different location
SAVE_DIR = os.path.realpath(os.path.join(CUR_DIR, '..', 'app_data'))
# SAVE_DIR = r'C:\Users\Administrator\Documents\Temp\Geonames'
# SAVE_DIR = '/Users/conrad/Sites/geonames'
SQLITE_FILE = os.path.join(SAVE_DIR, 'geonames.sqlite')

# Options
RECREATE_SQLITE_DB = True

# Globals
record_count = 0

#-------------------------------------------------
# Functions
#-------------------------------------------------

def countries_generator():
    """ Read the Geonames Countries File and yield each record """
    global record_count
    record_count = 0
    path = os.path.join(CUR_DIR, COUNTRIES_FILE)
    with open(path) as f:
        for line in f:
            line = line.rstrip('\n')
            if line != '' and not line.startswith('#'):
                values = line.split('\t')
                record_count += 1
                yield values

def places_generator():
    """ Read a Geonames Places File and yield each record """
    global record_count
    record_count = 0
    path = os.path.join(CUR_DIR, PLACES_FILE)
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.rstrip('\n')
            if line != '':
                values = line.split('\t')
                record_count += 1
                yield values

def main():
    """
    Main function that reads files and imports to a database
    """
    # Does the SQLite File already exist? Exit or delete based on option
    if RECREATE_SQLITE_DB and os.path.isfile(SQLITE_FILE):
        os.remove(SQLITE_FILE)
    if os.path.isfile(SQLITE_FILE):
        print('Error - File [{0}] already exists'.format(SQLITE_FILE))
        return

    # Connect to Db and Create Tables
    db = sqlite3.connect(SQLITE_FILE)
    cursor = db.cursor()
    cursor.execute('PRAGMA synchronous = OFF')
    cursor.execute('PRAGMA journal_mode = MEMORY')
    cursor.execute("""
        CREATE TABLE countries (
            iso TEXT,
            iso3 TEXT,
            iso_numeric INT,
            fips TEXT,
            country TEXT,
            capital TEXT,
            area_km INT,
            population INT,
            continent TEXT,
            tld TEXT,
            currency_code TEXT,
            currency_name TEXT,
            phone TEXT,
            postal_code_format TEXT,
            postal_code_regex TEXT,
            languages TEXT,
            geoname_id TEXT,
            neighbours TEXT,
            equivalent_fips_code TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE geonames (
            geonames_id INT PRIMARY KEY,
            name TEXT COLLATE NOCASE,
            ascii_name TEXT,
            alternate_names TEXT,
            latitude DOUBLE,
            longitude DOUBLE,
            feature_class TEXT,
            feature_code TEXT,
            country_code TEXT,
            cc2 TEXT,
            admin1_code TEXT,
            admin2_code TEXT,
            admin3_code TEXT,
            admin4_code TEXT,
            population LONG,
            elevation INT,
            dem INT,
            timezone TEXT,
            modification_date TEXT
        )
    """)

    # Insert Records for [countries] Table
    sql = 'INSERT INTO countries (iso, iso3, iso_numeric, fips, country, capital, area_km, population, continent, tld, currency_code, currency_name, phone, postal_code_format, postal_code_regex, languages, geoname_id, neighbours, equivalent_fips_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    cursor.executemany(sql, countries_generator())
    print('Added {0} Records to [countries] Table'.format(record_count))

    # Insert Records for [geonames] Table
    sql = 'INSERT INTO geonames (geonames_id, name, ascii_name, alternate_names, latitude, longitude, feature_class, feature_code, country_code, cc2, admin1_code, admin2_code, admin3_code, admin4_code, population, elevation, dem, timezone, modification_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    cursor.executemany(sql, places_generator())
    print('Added {0} Records to [geonames] Table'.format(record_count))

    # Add Indexes
    cursor.execute('CREATE INDEX country_feature ON geonames (country_code, feature_class, feature_code)')
    cursor.execute('CREATE INDEX country_admin1_feature ON geonames (country_code, admin1_code, feature_class, feature_code)')
    cursor.execute('CREATE INDEX place_names ON geonames (name , country_code, feature_class, feature_code, population)')

    # Commit Transactions
    db.commit()
    cursor.close()
    db.close()
    print('Success Database Created')

#-------------------------------------------------
# Start of Script
#-------------------------------------------------
if __name__ == '__main__':
    main()
