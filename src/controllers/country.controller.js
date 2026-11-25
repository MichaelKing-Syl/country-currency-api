const countryService = require("../services/country.service");
const imageService = require("../services/image.service");

async function refreshCountries(req, res, next) {
  try {
    const result =
      await countryService.refreshCountries();

    console.log(
      "Refresh database result:",
      result
    );

    const topCountries =
      await countryService.getTopFiveByGdp();

    console.log(
      "Top five GDP countries:",
      topCountries
    );

    await imageService.generateSummaryImage({
      totalCountries:
        result.totalCountries,
      topCountries,
      lastRefreshedAt:
        result.lastRefreshedAt,
    });

    console.log(
      "Summary image generated successfully."
    );

    res.status(200).json({
      message:
        "Countries refreshed successfully",
      total_countries:
        result.totalCountries,
      last_refreshed_at:
        result.lastRefreshedAt,
    });
  } catch (error) {
    console.error(
      "REFRESH ERROR:",
      error
    );

    next(error);
  }
}

async function getCountries(req, res, next) {
  try {
    const {
      region,
      currency,
      sort,
    } = req.query;

    const countries =
      await countryService.getCountries({
        region,
        currency,
        sort,
      });

    res.status(200).json(countries);
  } catch (error) {
    next(error);
  }
}

async function getCountryByName(req, res, next) {
  try {
    const country =
      await countryService.getCountryByName(
        req.params.name
      );

    if (!country) {
      return res.status(404).json({
        error: "Country not found",
      });
    }

    res.status(200).json(country);
  } catch (error) {
    next(error);
  }
}

async function deleteCountry(req, res, next) {
  try {
    const deleted =
      await countryService.deleteCountryByName(
        req.params.name
      );

    if (!deleted) {
      return res.status(404).json({
        error: "Country not found",
      });
    }

    res.status(200).json({
      message:
        "Country deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function getCountryImage(req, res, next) {
  try {
    const imagePath =
      imageService.getSummaryImagePath();

    return res.sendFile(imagePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        error: "Summary image not found",
      });
    }

    next(error);
  }
}

module.exports = {
  refreshCountries,
  getCountries,
  getCountryByName,
  deleteCountry,
  getCountryImage,
};