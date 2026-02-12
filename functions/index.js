const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

setGlobalOptions({ maxInstances: 10 });

// New moderation callables
const moderation = require("./moderation");
const legacy = require("./legacy-replacements");

exports.computeStdDrinksV2 = legacy.computeStdDrinksV2;
exports.computeCostPerServeV2 = legacy.computeCostPerServeV2;
exports.nextBottleROIV2 = legacy.nextBottleROIV2;
exports.importHumourLinesV2 = legacy.importHumourLinesV2;

exports.approveSubmission = moderation.approveSubmission;
exports.rejectSubmission = moderation.rejectSubmission;

exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});
