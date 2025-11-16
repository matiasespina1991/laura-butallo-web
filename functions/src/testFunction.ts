import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export const testFunction = functions.https.onRequest(async (req, res) => {
  const now = admin.firestore.Timestamp.now();

  res.send(`Firestore time: ${now.toDate().toISOString()}`);
});
