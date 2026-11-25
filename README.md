# Country Currency API

A RESTful Node.js/Express API that fetches country information and exchange rates from external APIs, calculates estimated GDP values, and caches the results in a MySQL database.

## Features

- Fetches country data from the REST Countries API.
- Fetches USD exchange rates from the ExchangeRate API.
- Extracts the first currency code for each country.
- Calculates estimated GDP using population, a random multiplier between 1000 and 2000, and the currency exchange rate.
- Stores country data in MySQL.
- Updates cached country data only when the refresh endpoint is called.
- Supports country lookup by name.
- Supports filtering by region and currency.
- Supports sorting by estimated GDP.
- Supports deleting cached countries.
- Provides cache status information.
- Generates a summary PNG image after a successful refresh.
- Uses centralized Express error handling.
- Includes automated API tests with Jest and Supertest.

## Technologies

- Node.js
- Express.js
- MySQL
- mysql2
- Axios
- Zod
- Sharp
- dotenv
- CORS
- Jest
- Supertest

## Project Structure

```text
country-currency-api/
├── cache/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── country.controller.js
│   ├── middleware/
│   │   └── error.middleware.js
│   ├── routes/
│   │   ├── country.routes.js
│   │   └── status.routes.js
│   ├── services/
│   │   ├── country.service.js
│   │   └── image.service.js
│   └── app.js
├── tests/
│   └── countries.test.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## Installation

Clone the repository and enter the project directory:

```bash
git clone https://github.com/MichaelKing-Syl/country-currency-api
cd country-currency-api
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=country_currency_api

REST_COUNTRIES_API_KEY=your_rest_countries_api_key
```

Never commit the `.env` file to GitHub.

## Database Setup

Create the MySQL database:

```sql
CREATE DATABASE IF NOT EXISTS country_currency_api;
```

The application expects the following tables:

- `countries`
- `app_status`

The `countries` table stores the cached country information, exchange rates, estimated GDP, flag URL, and refresh timestamp.

The `app_status` table stores the most recent successful refresh timestamp.

## Running the Application

Start the application in development mode:

```bash
npm run dev
```

Or start it normally:

```bash
npm start
```

The API runs on:

```text
http://localhost:5000
```

## API Endpoints

### Refresh countries

```http
POST /countries/refresh
```

Fetches the latest country data and exchange rates, calculates estimated GDP values, and updates the MySQL cache.

Example:

```bash
curl -X POST http://localhost:5000/countries/refresh
```

Successful response:

```json
{
  "message": "Countries refreshed successfully",
  "total_countries": 254,
  "last_refreshed_at": "2026-11-25T12:46:03.511Z"
}
```

### Get all cached countries

```http
GET /countries
```

Example:

```bash
curl http://localhost:5000/countries
```

### Filter by region

```http
GET /countries?region=Africa
```

### Filter by currency

```http
GET /countries?currency=NGN
```

### Sort by estimated GDP

```http
GET /countries?sort=gdp_desc
```

### Get a country by name

```http
GET /countries/:name
```

Example:

```bash
curl http://localhost:5000/countries/Nigeria
```

Country names are matched case-insensitively.

### Delete a country

```http
DELETE /countries/:name
```

Example:

```bash
curl -X DELETE http://localhost:5000/countries/Nigeria
```

### Get API status

```http
GET /status
```

Example response:

```json
{
  "total_countries": 254,
  "last_refreshed_at": "2026-11-25T12:46:04.000Z"
}
```

### Get summary image

```http
GET /countries/image
```

Returns the generated PNG summary image.

The image contains:

- Total number of countries
- Top 5 countries by estimated GDP
- Last refresh timestamp

## Refresh Behavior

The country cache is refreshed only when:

```http
POST /countries/refresh
```

is called.

For countries with multiple currencies, the first currency is used.

For countries with an empty currencies array:

- `currency_code` is `null`
- `exchange_rate` is `null`
- `estimated_gdp` is `0`

If a currency is not available in the exchange-rate response:

- `exchange_rate` is `null`
- `estimated_gdp` is `null`

Existing countries are matched using a case-insensitive country name and updated during refresh.

## Error Responses

### Country not found

```json
{
  "error": "Country not found"
}
```

HTTP status:

```text
404
```

### Internal server error

```json
{
  "error": "Internal server error"
}
```

HTTP status:

```text
500
```

### External API unavailable

```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from REST Countries API"
}
```

or:

```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from Exchange Rate API"
}
```

HTTP status:

```text
503
```

If either external API fails during refresh, the existing database records are not modified.

## Testing

Run the automated tests with:

```bash
npm test
```

The current test suite covers:

- API status
- Country listing
- Country lookup
- 404 handling
- Region filtering
- Currency filtering
- GDP sorting
- Country deletion
- Summary image response

Current test result:

```text
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

## Security

The `.env` file contains sensitive configuration and must not be committed.

The `.gitignore` file excludes:

```text
.env
node_modules/
cache/*.png
coverage/
```

## Author

Michael Sylvester