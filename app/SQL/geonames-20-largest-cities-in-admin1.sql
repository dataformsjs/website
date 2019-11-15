SELECT
    geonames_id,
    name,
    feature_class,
    feature_code,
    country_code,
    cc2,
    admin1_code,
    admin2_code,
    admin3_code,
    admin4_code,
    population,
    elevation,
    dem,
    timezone,
    modification_date
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