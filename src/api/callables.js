import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

// V2 callables
export const computeStdDrinksV2 = httpsCallable(functions, "computeStdDrinksV2");
export const computeCostPerServeV2 = httpsCallable(functions, "computeCostPerServeV2");
export const nextBottleROIV2 = httpsCallable(functions, "nextBottleROIV2");
export const importHumourLinesV2 = httpsCallable(functions, "importHumourLinesV2"); // admin-only

