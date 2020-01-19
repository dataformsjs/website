/**
 * NodeJS Express/GraphQL Web Service.
 * This gets called from PHP using HttpClient, or if developing
 * locally this can run from localhost using GraphiQL. If calling from
 * PHP then the node service must already be started.
 *
 * To use this Geonames database it must first be created locally
 * using one of the following scripts:
 *     scripts/geonames.py
 *     scripts/geonames.rb
 *
 * Installing Node Dependencies:
 *     npm i express graphql express-graphql sqlite
 */

// Node Libraries
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const sqlite = require('sqlite');

// Config, the database can be in either [../app_data] or [../../geonames]
const port = 4000;
let dbPath = path.join(__dirname, '..', 'app_data', 'geonames.sqlite');
if (!fs.existsSync(dbPath)) {
    dbPath = path.join(__dirname, '..', '..', 'geonames', 'geonames.sqlite');
}

// Connect to Database
if (!fs.existsSync(dbPath)) {
    console.error('Error - Geonames Database file must be created first: ' + dbPath);
    process.exitCode = 1;
    return;
}
const dbPromise = sqlite.open(dbPath, { Promise });

// Build GraphQL Schema
// Note - additional fields exist in the db for [type Country]
// however they are not used in the app so they are not included here.
// Also for simplicity [place.alternate_names] only works for the
// [place(id: Int!)] query, it the field were requested on other services
// the code would error, however it's not important to fix because it's
// not used in any of the demo apps.
var schema = buildSchema(`
    type Country {
        iso: String
        country: String
        area_km: String
        population: String
        continent: String
    }

    type Place {
        geonames_id: Int
        name: String
        ascii_name: String
        alternate_names: [String]
        latitude: Float
        longitude: Float
        feature_class: String
        feature_code: String
        country_code: String
        cc2: String
        admin1_code: String
        admin2_code: String
        admin3_code: String
        admin4_code: String
        population: Int
        elevation: String
        dem: Int
        timezone: String
        modification_date: String
    }

    type Query {
        countries(orderBy: String): [Country]
        regions(country: String!): [Place]
        cities(country: String!, region:String!): [Place]
        place(id: Int!): Place
        search(country: String, city: String!): [Place]
    }
`);

// Functions for GraphQL
const root = {
    countries: async function({orderBy}) {
        const sortOrder = (orderBy === 'country' ? 'country' : 'population DESC, country');
        const sql = `
            SELECT
                iso,
                country,
                area_km,
                population,
                CASE continent
                    WHEN 'AF' THEN 'Africa'
                    WHEN 'AS' THEN 'Asia '
                    WHEN 'EU' THEN 'Europe'
                    WHEN 'NA' THEN 'North America'
                    WHEN 'OC' THEN 'Oceania'
                    WHEN 'SA' THEN 'South America'
                    WHEN 'AN' THEN 'Antarctica'
                    ELSE continent
                END AS continent
            FROM countries
            ORDER BY
                ${sortOrder}`;
        const db = await dbPromise;
        return await db.all(sql);
    },

    regions: async function({country}) {
        const sql = `
            SELECT *
            FROM geonames
            WHERE
                country_code = ?
                AND feature_class = 'A'
                AND feature_code = 'ADM1'
            ORDER BY
                country_code,
                name
        `;
        const db = await dbPromise;
        return await db.all(sql, country);
    },

    // City List is limited to the 20 largest cities in a region
    cities: async function({country, region}) {
        const sql = `
            SELECT *
            FROM geonames
            WHERE
                country_code = ?
                AND admin1_code = ?
                AND feature_class = 'P'
                AND feature_code NOT IN ('PPLCH', 'PPLH', 'PPLQ', 'PPLW')
            ORDER BY
                population DESC,
                name
            LIMIT 20
        `;
        const db = await dbPromise;
        return await db.all(sql, country, region);
    },

    place: async function({id}) {
        const sql = 'SELECT * FROM geonames WHERE geonames_id = ?';
        const db = await dbPromise;
        const place = await db.get(sql, id);
        if (place.alternate_names) {
            place.alternate_names = place.alternate_names.split(',');
        } else {
            place.alternate_names = [];
        }
        return place;
    },

    // Search is limited to the 100 largest matching cities
    search: async function({country, city}) {
        // Build Where Clause and Params
        let where;
        let params = [];

        // country_code is optional
        if (country.trim()) {
            where = 'country_code = ? AND name = ?';
            params.push(country.trim());
        } else {
            where = 'name = ?';
        }
        params.push(city.trim());

        let sql = `
            SELECT *
            FROM geonames
            WHERE ${where}
                AND feature_class = 'P'
                AND feature_code NOT IN ('PPLCH', 'PPLH', 'PPLQ', 'PPLW')
            ORDER BY
                population DESC,
                country_code,
                timezone
            LIMIT 100
        `;

        const db = await dbPromise;
        return await db.all(sql, params);
    },
};

// Setup and run GraphQL Server
// Typically [graphiql] will be set to [false] for public URLs. This page is intended
// for developer testing and to use a PHP public facing site so it is always [true].
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

app.listen(port, () => {
    console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`);
});
