function requireAuth(auth) {
  if (!auth) throw new HttpsError("unauthenticated", "Sign in required.");
}

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

if (getApps().length === 0) initializeApp();
const db = getFirestore();

/**
 * AU Standard drink = 10g alcohol
 * grams = volume_ml * (abv/100) * 0.789
 * std = grams / 10
 */
exports.computeStdDrinksV2 = onCall(async (req) => {
  requireAuth(req.auth);
  
  const payload = (req.data && req.data.data) ? req.data.data : (req.data || {});
  const { abvPercent, volumeMl } = payload;
  const abv = Number(abvPercent);
  const vol = Number(volumeMl);

  if (!Number.isFinite(abv) || !Number.isFinite(vol) || abv <= 0 || vol <= 0) {
    throw new HttpsError("invalid-argument", "Provide abvPercent and volumeMl as positive numbers.");
  }

  const gramsAlcohol = vol * (abv / 100) * 0.789;
  const stdDrinks = gramsAlcohol / 10;

  return { stdDrinks: Math.round(stdDrinks * 100) / 100 };
});

exports.computeCostPerServeV2 = onCall(async (req) => {
  requireAuth(req.auth);

  const payload = (req.data && req.data.data) ? req.data.data : (req.data || {});
  const { bottlePrice, bottleVolumeMl, serveMl } = payload;
  const price = Number(bottlePrice);
  const bottleVol = Number(bottleVolumeMl);
  const serve = Number(serveMl);

  if (![price, bottleVol, serve].every(Number.isFinite) || price <= 0 || bottleVol <= 0 || serve <= 0) {
    throw new HttpsError("invalid-argument", "Provide bottlePrice, bottleVolumeMl, serveMl as positive numbers.");
  }

  const servesPerBottle = bottleVol / serve;
  const costPerServe = price / servesPerBottle;

  return {
    servesPerBottle: Math.round(servesPerBottle * 100) / 100,
    costPerServe: Math.round(costPerServe * 100) / 100,
  };
});

exports.nextBottleROIV2 = onCall(async (req) => {
  requireAuth(req.auth);

  const payload = (req.data && req.data.data) ? req.data.data : (req.data || {});
  const { bottlePrice, bottleVolumeMl, serveMl, sellPricePerServe } = payload;
  const price = Number(bottlePrice);
  const bottleVol = Number(bottleVolumeMl);
  const serve = Number(serveMl);
  const sell = Number(sellPricePerServe);

  if (![price, bottleVol, serve, sell].every(Number.isFinite) || price <= 0 || bottleVol <= 0 || serve <= 0 || sell <= 0) {
    throw new HttpsError("invalid-argument", "Provide bottlePrice, bottleVolumeMl, serveMl, sellPricePerServe as positive numbers.");
  }

  const servesPerBottle = bottleVol / serve;
  const costPerServe = price / servesPerBottle;
  const profitPerServe = sell - costPerServe;
  const totalProfitPerBottle = profitPerServe * servesPerBottle;
  const roiMultiple = totalProfitPerBottle / price;

  return {
    profitPerServe: Math.round(profitPerServe * 100) / 100,
    totalProfitPerBottle: Math.round(totalProfitPerBottle * 100) / 100,
    roiMultiple: Math.round(roiMultiple * 100) / 100,
  };
});

function requireAdmin(auth) {
  if (!auth) throw new HttpsError("unauthenticated", "Sign in required.");
  if (!auth.token || auth.token.isAdmin !== true) throw new HttpsError("permission-denied", "Admin only.");
}

exports.importHumourLinesV2 = onCall(async (req) => {
  requireAdmin(req.auth);

  const payload = (req.data && req.data.data) ? req.data.data : (req.data || {});
  const { lines } = payload;
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new HttpsError("invalid-argument", "Provide lines: string[]");
  }

  const batch = db.batch();
  const col = db.collection("humourLines");

  let count = 0;
  for (const line of lines) {
    const text = String(line || "").trim();
    if (!text) continue;

    const ref = col.doc();
    batch.set(ref, {
      text,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: req.auth.uid,
    });
    count++;
  }

  if (count === 0) return { ok: true, imported: 0 };

  await batch.commit();
  return { ok: true, imported: count };
});
