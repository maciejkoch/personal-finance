import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/** Shared instance with the existing bond importer; never silently select a new database. */
export function database(): Firestore {
  if (!getApps().length) initializeApp();
  return getFirestore(process.env.BOND_DATABASE_ID || "(default)");
}
