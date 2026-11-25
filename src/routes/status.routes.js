const express = require("express");

const countryService =
  require("../services/country.service");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const status =
      await countryService.getStatus();

    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
});

module.exports = router;