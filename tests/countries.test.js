const request = require("supertest");

const app = require("../src/app");

const {
  closeDatabaseConnection,
} = require("../src/config/db");

describe("Country Currency API", () => {
  test(
    "GET /status should return country count and refresh timestamp",
    async () => {
      const response = await request(app)
        .get("/status")
        .expect(200);

      expect(response.body).toHaveProperty(
        "total_countries"
      );

      expect(response.body).toHaveProperty(
        "last_refreshed_at"
      );

      expect(
        typeof response.body.total_countries
      ).toBe("number");
    }
  );

  test(
    "GET /countries should return countries",
    async () => {
      const response = await request(app)
        .get("/countries")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(
        true
      );

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty(
          "name"
        );

        expect(response.body[0]).toHaveProperty(
          "population"
        );

        expect(response.body[0]).toHaveProperty(
          "currency_code"
        );
      }
    }
  );

  test(
    "GET /countries/Nigeria should return Nigeria",
    async () => {
      const response = await request(app)
        .get("/countries/Nigeria")
        .expect(200);

      expect(response.body.name).toBe(
        "Nigeria"
      );

      expect(response.body.region).toBe(
        "Africa"
      );
    }
  );

  test(
    "GET /countries/Atlantis should return 404",
    async () => {
      const response = await request(app)
        .get("/countries/Atlantis")
        .expect(404);

      expect(response.body).toEqual({
        error: "Country not found",
      });
    }
  );

  test(
    "GET /countries?region=Africa should filter by region",
    async () => {
      const response = await request(app)
        .get("/countries?region=Africa")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(
        true
      );

      response.body.forEach((country) => {
        expect(country.region).toBe("Africa");
      });
    }
  );

  test(
    "GET /countries?currency=NGN should filter by currency",
    async () => {
      const response = await request(app)
        .get("/countries?currency=NGN")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(
        true
      );

      response.body.forEach((country) => {
        expect(country.currency_code).toBe(
          "NGN"
        );
      });
    }
  );

  test(
    "GET /countries?sort=gdp_desc should sort by GDP descending",
    async () => {
      const response = await request(app)
        .get("/countries?sort=gdp_desc")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(
        true
      );

      for (
        let i = 0;
        i < response.body.length - 1;
        i++
      ) {
        const current =
          response.body[i].estimated_gdp;

        const next =
          response.body[i + 1].estimated_gdp;

        if (
          current !== null &&
          next !== null
        ) {
          expect(
            Number(current)
          ).toBeGreaterThanOrEqual(
            Number(next)
          );
        }
      }
    }
  );

  test(
    "DELETE /countries/:name should return 404 for missing country",
    async () => {
      const response = await request(app)
        .delete("/countries/Atlantis")
        .expect(404);

      expect(response.body).toEqual({
        error: "Country not found",
      });
    }
  );

  test(
    "GET /countries/image should return PNG image",
    async () => {
      const response = await request(app)
        .get("/countries/image")
        .expect(200);

      expect(
        response.headers["content-type"]
      ).toMatch(/image\/png/);
    }
  );
});

afterAll(async () => {
  await closeDatabaseConnection();
});