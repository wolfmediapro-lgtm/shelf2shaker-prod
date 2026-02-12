const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

if (getApps().length === 0) initializeApp();
const db = getFirestore();

function requireAdmin(auth) {
  if (!auth) throw new HttpsError("unauthenticated", "Sign in required.");
  if (!auth.token || auth.token.isAdmin !== true) {
    throw new HttpsError("permission-denied", "Admin only.");
  }
}

exports.approveSubmission = onCall(async (req) => {
  requireAdmin(req.auth);

  const { groupId, submissionId } = req.data || {};
  if (!groupId || !submissionId) {
    throw new HttpsError("invalid-argument", "groupId and submissionId are required.");
  }

  const subRef = db.doc(`groups/${groupId}/submissions/${submissionId}`);
  const subSnap = await subRef.get();
  if (!subSnap.exists) throw new HttpsError("not-found", "Submission not found.");

  const sub = subSnap.data();
  if (sub.status !== "pending") {
    throw new HttpsError("failed-precondition", `Submission is ${sub.status}, not pending.`);
  }

  const cocktailRef = db.collection(`groups/${groupId}/cocktails`).doc();

  const approvedPayload = {
    ...sub,
    status: "approved",
    sourceSubmissionId: submissionId,
    approvedBy: req.auth.uid,
    approvedAt: FieldValue.serverTimestamp(),
    createdAt: sub.createdAt || FieldValue.serverTimestamp(),
  };

  await db.runTransaction(async (tx) => {
    tx.set(cocktailRef, approvedPayload, { merge: false });
    tx.set(
      subRef,
      {
        status: "approved",
        reviewedBy: req.auth.uid,
        reviewedAt: FieldValue.serverTimestamp(),
        approvedCocktailId: cocktailRef.id,
      },
      { merge: true }
    );
  });

  return { ok: true, approvedCocktailId: cocktailRef.id };
});

exports.rejectSubmission = onCall(async (req) => {
  requireAdmin(req.auth);

  const { groupId, submissionId, reason } = req.data || {};
  if (!groupId || !submissionId) {
    throw new HttpsError("invalid-argument", "groupId and submissionId are required.");
  }

  const subRef = db.doc(`groups/${groupId}/submissions/${submissionId}`);
  const subSnap = await subRef.get();
  if (!subSnap.exists) throw new HttpsError("not-found", "Submission not found.");

  const sub = subSnap.data();
  if (sub.status !== "pending") {
    throw new HttpsError("failed-precondition", `Submission is ${sub.status}, not pending.`);
  }

  await subRef.set(
    {
      status: "rejected",
      reviewNotes: reason || "",
      reviewedBy: req.auth.uid,
      reviewedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
});
