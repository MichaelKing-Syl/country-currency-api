const axios = require("axios");
const { pool } = require("../config/db");

const REST_COUNTRIES_URL =
  "https://api.restcountries.com/countries/v5";

const EXCHANGE_RATES_URL =
  "https://open.er-api.com/v6/latest/USD";

const API_TIMEOUT = 15000;

/**
 * Fetch all countries from REST Countries API.
 * The API is paginated, so we continue until meta.more === false.
 */
async function fetchAllCountries() {
  const apiKey = process.env.REST_COUNTRIES_API_KEY;

  if (!apiKey) {
    throw new Error("REST_COUNTRIES_API_KEY is missing");
  }

  const countries = [];

  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await axios.get(REST_COUNTRIES_URL, {
      params: {
        limit,
        offset,
      },
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: API_TIMEOUT,
    });

    const data = response.data?.data;

    if (!data || !Array.isArray(data.objects)) {
      throw new Error("Invalid response from REST Countries API");
    }

    countries.push(...data.objects);

    console.log(
      `Fetched ${countries.length} countries...`
    );

    if (!data.meta?.more) {
      break;
    }

    offset += limit;
  }

  return countries;
}

/**
 * Fetch exchange rates once.
 */
async function fetchExchangeRates() {
  const response = await axios.get(EXCHANGE_RATES_URL, {
    timeout: API_TIMEOUT,
  });

  if (
    response.data?.result !== "success" ||
    !response.data?.rates
  ) {
    throw new Error("Invalid response from Exchange Rate API");
  }

  return response.data.rates;
}

/**
 * Generate a random number between 1000 and 2000.
 */
function generateGdpMultiplier() {
  return Math.floor(Math.random() * 1001) + 1000;
}

/**
 * Convert REST Countries data into the structure
 * required by our MySQL database.
 */
function transformCountry(country, rates) {
  const name = country.names?.common || null;

  const capital =
    country.capitals?.[0]?.name || null;

  const region = country.region || null;

  const population =
    Number(country.population) || 0;

  const currencyCode =
    country.currencies?.[0]?.code || null;

  const flagUrl =
    country.flag?.url_svg || null;

  // No currency
  if (!currencyCode) {
    return {
      name,
      capital,
      region,
      population,
      currency_code: null,
      exchange_rate: null,
      estimated_gdp: 0,
      flag_url: flagUrl,
    };
  }

  const exchangeRate = rates[currencyCode];

  // Currency exists but exchange-rate API doesn't have it
  if (exchangeRate === undefined) {
    return {
      name,
      capital,
      region,
      population,
      currency_code: currencyCode,
      exchange_rate: null,
      estimated_gdp: null,
      flag_url: flagUrl,
    };
  }

  const multiplier = generateGdpMultiplier();

  const estimatedGdp =
    (population * multiplier) / Number(exchangeRate);

  return {
    name,
    capital,
    region,
    population,
    currency_code: currencyCode,
    exchange_rate: Number(exchangeRate),
    estimated_gdp: estimatedGdp,
    flag_url: flagUrl,
  };
}

/**
 * Refresh all country data.
 *
 * IMPORTANT:
 * We fetch ALL external data first.
 * Only after successful external requests do we modify MySQL.
 */
async function refreshCountries() {
  console.log("Starting country refresh...");

  // These happen BEFORE any database modification.
  let rawCountries;
  let exchangeRates;

  try {
    rawCountries = await fetchAllCountries();
  } catch (error) {
    console.error(
      "REST Countries API error:",
      error.message
    );

    const apiError = new Error(
      "Could not fetch data from REST Countries API"
    );

    apiError.statusCode = 503;
    apiError.details =
      "Could not fetch data from REST Countries API";

    throw apiError;
  }

  try {
    exchangeRates = await fetchExchangeRates();
  } catch (error) {
    console.error(
      "Exchange Rate API error:",
      error.message
    );

    const apiError = new Error(
      "Could not fetch data from Exchange Rate API"
    );

    apiError.statusCode = 503;
    apiError.details =
      "Could not fetch data from Exchange Rate API";

    throw apiError;
  }

  console.log(
    `Successfully fetched ${rawCountries.length} countries.`
  );

  // Transform everything before touching the database.
  const countries = rawCountries.map((country) =>
    transformCountry(country, exchangeRates)
  );

  const connection = await pool.getConnection();

  // One timestamp for this entire refresh.
  const refreshTime = new Date();

  try {
    await connection.beginTransaction();

    for (const country of countries) {
      const [existingRows] = await connection.query(
        `
        SELECT id
        FROM countries
        WHERE LOWER(name) = LOWER(?)
        LIMIT 1
        FOR UPDATE
        `,
        [country.name]
      );

      if (existingRows.length > 0) {
        await connection.query(
          `
          UPDATE countries
          SET
            name = ?,
            capital = ?,
            region = ?,
            population = ?,
            currency_code = ?,
            exchange_rate = ?,
            estimated_gdp = ?,
            flag_url = ?,
            last_refreshed_at = ?
          WHERE id = ?
          `,
          [
            country.name,
            country.capital,
            country.region,
            country.population,
            country.currency_code,
            country.exchange_rate,
            country.estimated_gdp,
            country.flag_url,
            refreshTime,
            existingRows[0].id,
          ]
        );
      } else {
        await connection.query(
          `
          INSERT INTO countries (
            name,
            capital,
            region,
            population,
            currency_code,
            exchange_rate,
            estimated_gdp,
            flag_url,
            last_refreshed_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            country.name,
            country.capital,
            country.region,
            country.population,
            country.currency_code,
            country.exchange_rate,
            country.estimated_gdp,
            country.flag_url,
            refreshTime,
          ]
        );
      }
    }

    await connection.query(
      `
      UPDATE app_status
      SET last_refreshed_at = ?
      WHERE id = 1
      `,
      [refreshTime]
    );

    await connection.commit();

    console.log(
      `Database refresh completed successfully. ${countries.length} countries processed.`
    );

    return {
      totalCountries: countries.length,
      lastRefreshedAt: refreshTime,
      countries,
    };
  } catch (error) {
    await connection.rollback();

    console.error(
      "Database refresh failed:",
      error.message
    );

    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get countries with optional filtering and sorting.
 */
async function getCountries({
  region,
  currency,
  sort,
}) {
  let query = `
    SELECT
      id,
      name,
      capital,
      region,
      population,
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url,
      last_refreshed_at
    FROM countries
    WHERE 1 = 1
  `;

  const params = [];

  if (region) {
    query += ` AND LOWER(region) = LOWER(?)`;
    params.push(region);
  }

  if (currency) {
    query += ` AND LOWER(currency_code) = LOWER(?)`;
    params.push(currency);
  }

  if (sort === "gdp_desc") {
    query += `
      ORDER BY
        estimated_gdp IS NULL,
        estimated_gdp DESC
    `;
  } else {
    query += ` ORDER BY name ASC`;
  }

  const [rows] = await pool.query(query, params);

  return rows;
}

/**
 * Get one country by name.
 */
async function getCountryByName(name) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      name,
      capital,
      region,
      population,
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url,
      last_refreshed_at
    FROM countries
    WHERE LOWER(name) = LOWER(?)
    LIMIT 1
    `,
    [name]
  );

  return rows[0] || null;
}

/**
 * Delete one country by name.
 */
async function deleteCountryByName(name) {
  const [result] = await pool.query(
    `
    DELETE FROM countries
    WHERE LOWER(name) = LOWER(?)
    `,
    [name]
  );

  return result.affectedRows > 0;
}

/**
 * Get application status.
 */
async function getStatus() {
  const [countryRows] = await pool.query(
    `
    SELECT COUNT(*) AS total_countries
    FROM countries
    `
  );

  const [statusRows] = await pool.query(
    `
    SELECT last_refreshed_at
    FROM app_status
    WHERE id = 1
    `
  );

  return {
    total_countries: Number(
      countryRows[0].total_countries
    ),
    last_refreshed_at:
      statusRows[0]?.last_refreshed_at || null,
  };
}

/**
 * Get top 5 countries by estimated GDP.
 */
async function getTopFiveByGdp() {
  const [rows] = await pool.query(
    `
    SELECT name, estimated_gdp
    FROM countries
    WHERE estimated_gdp IS NOT NULL
    ORDER BY estimated_gdp DESC
    LIMIT 5
    `
  );

  return rows;
}

module.exports = {
  fetchAllCountries,
  fetchExchangeRates,
  transformCountry,
  refreshCountries,
  getCountries,
  getCountryByName,
  deleteCountryByName,
  getStatus,
  getTopFiveByGdp,
};