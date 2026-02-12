import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();
const db = getFirestore();

function requireAdmin(auth: any) {
  if (!auth) throw new HttpsError("unauthenticated", "Sign in required.");
  if (!auth.token?.isAdmin) throw new HttpsError("permission-denied", "Admin only.");
}

export const approveSubmission = onCall(async (req) => {
  requireAdmin(req.auth);

  const { groupId, submissionId } = req.data || {};
  if (!groupId || !submissionId) {
    throw new HttpsError("invalid-argument", "groupId and submissionId are required.");
  }

  const subRef = db.doc(`groups/${groupId}/submissions/${submissionId}`);
  const subSnap = await subRef.get();
  if (!subSnap.exists) throw new HttpsError("not-found", "Submission not found.");

  const sub = subSnap.data() as any;
  if (sub.status !== "pending") {
    throw new HttpsError("failed-precondition", `Submission is ${sub.status}, not pending.`);
  }

  const cocktailRef = db.collection(`groups/${groupId}/cocktails`).doc(); // new id

  // Copy submission → approved cocktail
  const approvedPayload = {
    ...sub,
    status: "approved",
    sourceSubmissionId: submissionId,
    approvedBy: req.auth!.uid,
    approvedAt: FieldValue.serverTimestamp(),
    // Use submission createdAt if present; else stamp now
    createdAt: sub.createdAt ?? FieldValue.serverTimestamp(),
  };

  await db.runTransaction(async (tx) => {
    tx.set(cocktailRef, approvedPayload, { merge: false });
    tx.set(
      subRef,
      {
        status: "approved",
        reviewedBy: req.auth!.uid,
        reviewedAt: FieldValue.serverTimestamp(),
        approvedCocktailId: cocktailRef.id,
      },
      { merge: true }
    );
  });

  return { ok: true, approvedCocktailId: cocktailRef.id };
});

export const rejectSubmission = onCall(async (req) => {
  requireAdmin(req.auth);

  const { groupId, submissionId, reason } = req.data || {};
  if (!groupId || !submissionId) {
    throw new HttpsError("invalid-argument", "groupId and submissionId are required.");
  }

  const subRef = db.doc(`groups/${groupId}/submissions/${submissionId}`);
  const subSnap = await subRef.get();
  if (!subSnap.exists) throw new HttpsError("not-found", "Submission not found.");

  const sub = subSnap.data() as any;
  if (sub.status !== "pending") {
    throw new HttpsError("failed-precondition", `Submission is ${sub.status}, not pending.`);
  }

  await subRef.set(
    {
      status: "rejected",
      reviewNotes: reason ?? "",
      reviewedBy: req.auth!.uid,
      reviewedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});

