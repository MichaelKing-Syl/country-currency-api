# Country Currency API

A RESTful Node.js and Express API that fetches country information and currency exchange rates from external APIs, calculates estimated GDP values, and stores the results in a MySQL database.

## Live Deployment

**Base URL:** https://country-currency-api-1.onrender.com

The API is deployed on Render and uses a MySQL database hosted on Railway.

## Features

- Fetches country information from the REST Countries API.
- Fetches USD exchange rates from the ExchangeRate API.
- Extracts the first available currency code for each country.
- Calculates estimated GDP using population, a random multiplier between 1,000 and 2,000, and the currency exchange rate.
- Stores country information in MySQL.
- Refreshes cached data only when the refresh endpoint is called.
- Supports country lookup by name.
- Supports filtering by region and currency.
- Supports sorting by estimated GDP.
- Supports deleting cached countries.
- Provides cache status information.
- Generates a PNG summary image after a successful refresh.
- Uses centralized Express error handling.
- Includes automated tests using Jest and Supertest.

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

Clone the repository:

```bash
git clone https://github.com/MichaelKing-Syl/country-currency-api.git
```

Enter the project directory:

```bash
cd country-currency-api
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=country_currency_api

REST_COUNTRIES_API_KEY=your_rest_countries_api_key

NODE_ENV=development
```

Replace the placeholder values with your own local database credentials and API key.

**Important:** Never commit your `.env` file or expose private credentials. The `.env` file is excluded through `.gitignore`.

A safe `.env.example` file is provided for reference.

## Database Setup

Create the MySQL database:

```sql
CREATE DATABASE IF NOT EXISTS country_currency_api;
```

The application uses the following tables:

- `countries` — stores cached country information, currency exchange rates, estimated GDP, flag URLs, and refresh timestamps.
- `app_status` — stores the timestamp of the most recent successful refresh.

Ensure your MySQL database is running and the database credentials are correctly configured before starting the application.

## Running the Application

Start in development mode:

```bash
npm run dev
```

Or start normally:

```bash
npm start
```

The local API runs at:

```text
http://localhost:5000
```

## API Endpoints

The following endpoints are available.

### 1. Refresh Countries

**POST** `/countries/refresh`

Fetches the latest country information and exchange rates, calculates estimated GDP values, and updates the MySQL cache.

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

### 2. Get All Countries

**GET** `/countries`

Returns all cached countries.

```bash
curl http://localhost:5000/countries
```

### 3. Filter Countries by Region

**GET** `/countries?region=Africa`

Returns countries belonging to the specified region.

### 4. Filter Countries by Currency

**GET** `/countries?currency=NGN`

Returns countries using the specified currency code.

### 5. Sort Countries by Estimated GDP

**GET** `/countries?sort=gdp_desc`

Returns countries sorted by estimated GDP in descending order.

### 6. Get a Country by Name

**GET** `/countries/:name`

Example:

```bash
curl http://localhost:5000/countries/Nigeria
```

Country names are matched case-insensitively.

### 7. Delete a Country

**DELETE** `/countries/:name`

Example:

```bash
curl -X DELETE http://localhost:5000/countries/Nigeria
```

Deletes the specified country from the cached database.

### 8. Get API Status

**GET** `/status`

Returns the total number of cached countries and the last successful refresh timestamp.

Example response:

```json
{
  "total_countries": 254,
  "last_refreshed_at": "2026-11-25T12:46:04.000Z"
}
```

### 9. Get Summary Image

**GET** `/countries/image`

Returns a generated PNG image containing:

- Total number of countries.
- Top five countries by estimated GDP.
- Last successful refresh timestamp.

## Refresh Behaviour and GDP Calculation

Country data is refreshed only when the following endpoint is called:

```http
POST /countries/refresh
```

For each country, the estimated GDP is calculated using:

```text
estimated_gdp = population × random(1000–2000) ÷ exchange_rate
```

Additional handling:

- For countries with multiple currencies, the first currency is used.
- For countries with an empty currencies array, `currency_code` and `exchange_rate` are `null`, while `estimated_gdp` is `0`.
- If a currency is unavailable in the exchange-rate response, `exchange_rate` and `estimated_gdp` are `null`.
- Existing countries are matched by name without case sensitivity and updated during refresh.
- A new random multiplier is used when GDP is recalculated during a refresh.
- If an external API fails during refresh, existing database records are protected from partial updates.

## Error Handling

The API returns appropriate HTTP status codes and error messages.

| Status Code | Description |
|---|---|
| 400 | Invalid request |
| 404 | Country not found |
| 500 | Internal server error |
| 503 | External data source unavailable |

Example 404 response:

```json
{
  "error": "Country not found"
}
```

Example 500 response:

```json
{
  "error": "Internal server error"
}
```

Example 503 response:

```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from REST Countries API"
}
```

If either external API fails during a refresh, the existing database records remain unchanged.

## Testing

Run the automated test suite:

```bash
npm test
```

The test suite covers:

- API status.
- Country listing.
- Country lookup.
- 404 handling.
- Region filtering.
- Currency filtering.
- GDP sorting.
- Country deletion.
- Summary image response.

Latest local test result:

```text
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

## Deployment

The application is deployed using:

- **Application hosting:** Render
- **Database hosting:** Railway MySQL

Live API:

https://country-currency-api-1.onrender.com

Production environment variables are configured through the hosting provider's environment settings. Sensitive credentials are not stored in the GitHub repository.

## Security

The `.gitignore` file excludes sensitive and unnecessary files:

```text
node_modules/
.env
cache/*.png
coverage/
```

Never upload database passwords, API keys, or other private credentials to GitHub.

## Author

Michael Sylvester