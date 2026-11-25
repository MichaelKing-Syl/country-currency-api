const express = require("express");

const {
  refreshCountries,
  getCountries,
  getCountryByName,
  deleteCountry,
  getCountryImage,
} = require("../controllers/country.controller");

const router = express.Router();

/*
 * IMPORTANT:
 * /image must come BEFORE /:name
 * otherwise Express could interpret "image"
 * as a country name.
 */

router.post(
  "/refresh",
  refreshCountries
);

router.get(
  "/image",
  getCountryImage
);

router.get(
  "/",
  getCountries
);

router.get(
  "/:name",
  getCountryByName
);

router.delete(
  "/:name",
  deleteCountry
);

module.exports = router;