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
    population DESC,
    country
