#==============================================================================
#
#   Import Geonames Data
#   Author: Conrad Sollitt
#
#   This is a one-time script that creates a SQLite Database using downloaded
#   data from Geonames. Geonames data is tab-delimited without a column
#   seperator and a number of records contain Quotes Characters ["] in
#   the data. SQLite can import most records from cli using the commands
#   listed below, however it fails on records with quotes. This script
#   successfully imports all records because it ignores quotes and it can
#   be easily modified as needed for different indexes, column names, etc.
#
#       sqlite3 geonames.sqlite
#       CREATE TABLE geonames (...
#       .mode tabs
#       .import allCountries.txt geonames
#       .exit
#
#   Dependencies:
#   gem install sqlite3
#
#   Links:
#   http://www.geonames.org/
#   http://download.geonames.org/export/dump/
#       From the above link download [allCountries.zip] and [countryInfo.txt].
#       Unzip [allCountries.zip] prior to running this script.
#   http://download.geonames.org/export/dump/readme.txt
#   https://www.sqlite.org/index.html
#   https://rubygems.org/gems/sqlite3
#
#   This script is expected to take about 6 to 10 minutes to run.
#
#   Expected Results:
#   Added 252 Records to [countries] Table
#   Added 11768184 Records to [geonames] Table
#   Success Database Created
#
#==============================================================================

# Dependencies
require 'sqlite3'

# File Settings
CUR_DIR = File.expand_path(File.dirname(__FILE__))
PLACES_FILE = 'allCountries.txt'
COUNTRIES_FILE = 'countryInfo.txt'

# Save to a separate [app_data] dir or simply hard-code a different location
SAVE_DIR = File.expand_path(File.join(CUR_DIR, '..', 'app_data'))
# SAVE_DIR = 'C:\Users\Administrator\Documents\Temp\Geonames'
# SAVE_DIR = '/Users/conrad/Sites/geonames'
SQLITE_FILE = File.join(SAVE_DIR, 'geonames.sqlite')

# Options
RECREATE_SQLITE_DB = true

#---------------------------------------------------------------------------
# Main function that reads files and imports to a database
#---------------------------------------------------------------------------
def main
    # Does the SQLite File already exist? Exit or delete based on option
    if RECREATE_SQLITE_DB && File.exist?(SQLITE_FILE)
        File.delete(SQLITE_FILE)
    end
    return "Error - File [#{SQLITE_FILE}] already exists" if File.exist?(SQLITE_FILE)

    # Connect to Db and Create Tables.
    # Several PRAGMA statements are used for optimization, however
    # the primary optimization for SQLite is Transactions otherwise
    # this script could take hours. Using prepared statements on
    # insert increases script performance by about 100%.
    db = SQLite3::Database.new(SQLITE_FILE)
    db.execute 'PRAGMA synchronous = OFF'
    db.execute 'PRAGMA journal_mode = MEMORY'
    db.transaction
    db.execute %{
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
    }
    db.execute %{
        CREATE TABLE geonames (
            geonames_id INT PRIMARY KEY,
            name TEXT,
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
    }

    # Insert Records for [countries] Table
    record_count = 0
    path = File.join(CUR_DIR, COUNTRIES_FILE)
    sql = 'INSERT INTO countries (iso, iso3, iso_numeric, fips, country, capital, area_km, population, continent, tld, currency_code, currency_name, phone, postal_code_format, postal_code_regex, languages, geoname_id, neighbours, equivalent_fips_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    stmt = db.prepare(sql)
    File.open(path, 'r') do |f|
        f.each_line do |line|
            if line.strip != '' && line.index('#') != 0
                values = line.split("\t")
                stmt.execute values
                record_count += 1
            end
        end
    end
    stmt.close
    puts "Added #{record_count} Records to [countries] Table"

    # Insert Records for [geonames] Table
    record_count = 0
    path = File.join(CUR_DIR, PLACES_FILE)
    sql = 'INSERT INTO geonames (geonames_id, name, ascii_name, alternate_names, latitude, longitude, feature_class, feature_code, country_code, cc2, admin1_code, admin2_code, admin3_code, admin4_code, population, elevation, dem, timezone, modification_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    stmt = db.prepare(sql)
    File.open(path, 'r:utf-8') do |f|
        f.each_line do |line|
            if line.strip != ''
                values = line.split("\t")
                stmt.execute values
                record_count += 1
            end
        end
    end
    stmt.close
    puts "Added #{record_count} Records to [geonames] Table"

    # Add Indexes
    db.execute 'CREATE INDEX country_feature ON geonames (country_code, feature_class, feature_code)'
    db.execute 'CREATE INDEX country_admin1_feature ON geonames (country_code, admin1_code, feature_class, feature_code)'
    db.execute 'CREATE INDEX place_names ON geonames (name , country_code, feature_class, feature_code, population)'

    # Commit Transactions and return
    db.commit
    db.close
    'Success Database Created'
end

#---------------------------------------------------------------------------
# Start of Script
#---------------------------------------------------------------------------
puts main
