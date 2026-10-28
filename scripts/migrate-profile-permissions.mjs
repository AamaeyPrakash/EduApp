#!/usr/bin/env node
// One-time migration for profiles created by older versions of the app.
//
// Older versions created each profile row before the user was signed in, so the
// rows have no permissions and could only be read through table-wide access.
// The app now gives every profile owner-only access. This script adds the same
// permissions (read + update for the owner) to existing profile rows, so you can
// remove the table-wide Read/Update/Create("Any") permissions afterwards.
//
// Usage (prints the changes; add --apply to save them):
//   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 \
//   APPWRITE_PROJECT_ID=... APPWRITE_DATABASE_ID=... \
//   APPWRITE_USER_ACCOUNTS_TABLE_ID=... \
//   APPWRITE_API_KEY=<key with rows.read and rows.write> \
//   node scripts/migrate-profile-permissions.mjs [--apply]

const apply = process.argv.includes('--apply');
const env = name => {
  const value = (process.env[name] || '').trim();
  if (!value) {
    console.error(`Missing environment variable ${name}`);
    process.exit(1);
  }
  return value;
};

const endpoint = env('APPWRITE_ENDPOINT').replace(/\/+$/, '');
const tablePath = `/tablesdb/${encodeURIComponent(
  env('APPWRITE_DATABASE_ID'),
)}/tables/${encodeURIComponent(env('APPWRITE_USER_ACCOUNTS_TABLE_ID'))}/rows`;
const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': env('APPWRITE_PROJECT_ID'),
  'X-Appwrite-Key': env('APPWRITE_API_KEY'),
};

async function call(method, path, body) {
  const response = await fetch(`${endpoint}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed (${response.status}): ${data.message}`,
    );
  }
  return data;
}

async function* allRows() {
  let cursor = null;
  for (;;) {
    const queries = [JSON.stringify({ method: 'limit', values: [100] })];
    if (cursor) {
      queries.push(JSON.stringify({ method: 'cursorAfter', values: [cursor] }));
    }
    const query = queries
      .map(item => `queries[]=${encodeURIComponent(item)}`)
      .join('&');
    const { rows } = await call('GET', `${tablePath}?${query}`);
    yield* rows;
    if (rows.length < 100) {
      return;
    }
    cursor = rows[rows.length - 1].$id;
  }
}

let checked = 0;
let updated = 0;
for await (const row of allRows()) {
  checked += 1;
  const owner = row.$id;
  const wanted = [`read("user:${owner}")`, `update("user:${owner}")`];
  const permissions = row.$permissions || [];
  const missing = wanted.filter(
    permission => !permissions.includes(permission),
  );
  if (missing.length === 0) {
    continue;
  }
  updated += 1;
  console.log(
    `${apply ? 'Updating' : 'Would update'} ${owner}: add ${missing.join(
      ', ',
    )}`,
  );
  if (apply) {
    await call('PATCH', `${tablePath}/${encodeURIComponent(owner)}`, {
      permissions: [...permissions, ...missing],
    });
  }
}

console.log(
  `\nChecked ${checked} profiles; ${updated} ${
    apply ? 'updated' : 'need updating (run again with --apply)'
  }.`,
);
