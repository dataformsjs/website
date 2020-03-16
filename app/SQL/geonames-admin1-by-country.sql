SELECT
    geonames_id,
    country_code,
    admin1_code,
    name,
    ascii_name,
    population,
    elevation,
    timezone,
    modification_date
FROM geonames 
WHERE
    country_code = ?
    AND feature_class = 'A'
    AND feature_code = 'ADM1'
ORDER BY 
    country_code,
    name
