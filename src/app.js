const express = require("express");
const cors = require("cors");

const countryRoutes = require("./routes/country.routes");
const statusRoutes = require("./routes/status.routes");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/countries", countryRoutes);
app.use("/status", statusRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;