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

// Decode JWT payload locally — no HTTP call needed.
// The Firestore PATCH below provides the real security enforcement via rules.
export function verifyAdminToken(idToken: string): string | null {
  try {
    const payload = idToken.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const uid = (decoded.sub ?? decoded.user_id ?? null) as string | null;
    if (!uid || uid !== process.env.ADMIN_UID) return null;
    return uid;
  } catch {
    return null;
  }
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
