type FirestoreValue =
  | { booleanValue: boolean }
  | { integerValue: string }
  | { stringValue: string }
  | { nullValue: null };

function toFirestoreValue(val: unknown): FirestoreValue {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return { integerValue: String(val) };
  return { stringValue: String(val) };
}

export async function verifyAdminToken(idToken: string): Promise<string | null> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const uid = (data.users?.[0]?.localId as string) ?? null;
  if (!uid || uid !== process.env.ADMIN_UID) return null;
  return uid;
}

export async function firestorePatch(
  docPath: string,
  fields: Record<string, unknown>,
  idToken: string,
  updateMaskFields?: string[],
): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;

  if (updateMaskFields && updateMaskFields.length > 0) {
    const params = updateMaskFields.map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
    url += `?${params}`;
  }

  const firestoreFields: Record<string, FirestoreValue> = {};
  for (const [key, val] of Object.entries(fields)) {
    firestoreFields[key] = toFirestoreValue(val);
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields: firestoreFields }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore PATCH failed (${res.status}): ${body}`);
  }
}
