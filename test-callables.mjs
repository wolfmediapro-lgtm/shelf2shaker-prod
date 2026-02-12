import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

// 1) Paste your Firebase web config here (from your src/firebase.js)
const firebaseConfig = {
  // apiKey: "...",
  // authDomain: "...",
  // projectId: "shelf2shaker-prod",
  // appId: "...",
};

// 2) Provide a real test user login
const EMAIL = process.env.TEST_EMAIL;
const PASS  = process.env.TEST_PASS;

if (!EMAIL || !PASS) {
  console.error("Set TEST_EMAIL and TEST_PASS env vars first.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, "us-central1");

await signInWithEmailAndPassword(auth, EMAIL, PASS);

// Std drinks test (40% spirit, 30ml)
const computeStdDrinksV2 = httpsCallable(functions, "computeStdDrinksV2");
const res1 = await computeStdDrinksV2({ abvPercent: 40, volumeMl: 30 });
console.log("computeStdDrinksV2:", res1.data);

// Cost per serve (bottle $60, 700ml, 30ml serve)
const computeCostPerServeV2 = httpsCallable(functions, "computeCostPerServeV2");
const res2 = await computeCostPerServeV2({ bottlePrice: 60, bottleVolumeMl: 700, serveMl: 30 });
console.log("computeCostPerServeV2:", res2.data);

// ROI test (sell $18/serve)
const nextBottleROIV2 = httpsCallable(functions, "nextBottleROIV2");
const res3 = await nextBottleROIV2({ bottlePrice: 60, bottleVolumeMl: 700, serveMl: 30, sellPricePerServe: 18 });
console.log("nextBottleROIV2:", res3.data);

