const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const CACHE_DIR = path.join(
  process.cwd(),
  "cache"
);

const IMAGE_PATH = path.resolve(
  CACHE_DIR,
  "summary.png"
);

async function generateSummaryImage({
  totalCountries,
  topCountries,
  lastRefreshedAt,
}) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, {
      recursive: true,
    });
  }

  const formattedDate =
    new Date(lastRefreshedAt).toISOString();

  /*
   * Create one SVG <text> element for each country.
   * SVG <text> does not interpret <br/> as a line break,
   * so each country needs its own y-position.
   */
  const topFiveText =
    topCountries.length > 0
      ? topCountries
          .slice(0, 5)
          .map((country, index) => {
            const yPosition =
              310 + index * 55;

            return `
              <text
                x="100"
                y="${yPosition}"
                font-size="25"
                font-family="Arial">
                ${index + 1}. ${country.name} - ${Number(
                  country.estimated_gdp
                ).toFixed(2)}
              </text>
            `;
          })
          .join("")
      : `
          <text
            x="100"
            y="310"
            font-size="25"
            font-family="Arial">
            No GDP data available
          </text>
        `;

  const svg = `
    <svg width="1200" height="800"
         xmlns="http://www.w3.org/2000/svg">

      <rect
        width="1200"
        height="800"
        fill="white"/>

      <text
        x="600"
        y="90"
        text-anchor="middle"
        font-size="42"
        font-family="Arial"
        font-weight="bold">
        Country Currency API
      </text>

      <text
        x="600"
        y="160"
        text-anchor="middle"
        font-size="32"
        font-family="Arial">
        Total Countries: ${totalCountries}
      </text>

      <text
        x="80"
        y="250"
        font-size="30"
        font-family="Arial"
        font-weight="bold">
        Top 5 by Estimated GDP
      </text>

      ${topFiveText}

      <text
        x="80"
        y="650"
        font-size="24"
        font-family="Arial">
        Last Refresh:
      </text>

      <text
        x="80"
        y="695"
        font-size="22"
        font-family="Arial">
        ${formattedDate}
      </text>

    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(IMAGE_PATH);

  console.log(
    `Summary image generated at ${IMAGE_PATH}`
  );
}

function getSummaryImagePath() {
  if (!fs.existsSync(IMAGE_PATH)) {
    const error = new Error(
      "Summary image not found"
    );

    error.code = "ENOENT";

    throw error;
  }

  return IMAGE_PATH;
}

module.exports = {
  generateSummaryImage,
  getSummaryImagePath,
};