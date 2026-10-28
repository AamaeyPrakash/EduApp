'use strict';

// Appwrite Function: permanently deletes the signed-in user's account.
//
// App Store and Google Play require apps with sign-up to offer account deletion. The
// client SDK can't delete users, so the app calls this function, which removes the
// caller's profile row and then the account itself (ending all its sessions).
// It only ever acts on the user who ran it.
//
// Console settings: Execute access "Users"; scopes users.write and rows.write.
// Environment variables:
//   APPWRITE_DATABASE_ID              required (same value as the app's .env)
//   APPWRITE_USER_ACCOUNTS_TABLE_ID   required (same value as the app's .env)
//   APPWRITE_API_KEY                  only for Appwrite versions before 1.6,
//                                     which don't give functions a dynamic key

async function handleDeleteAccount({ req, res, log, error }, { fetch, env }) {
  if (req.method !== 'POST') {
    return res.json({ error: 'Use POST to delete an account.' }, 405);
  }
  // Set by Appwrite for executions made with a user session; clients can't forge it.
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) {
    return res.json({ error: 'Please sign in to delete your account.' }, 401);
  }

  const endpoint = (
    env.APPWRITE_FUNCTION_API_ENDPOINT ||
    env.APPWRITE_ENDPOINT ||
    ''
  ).replace(/\/+$/, '');
  const projectId = env.APPWRITE_FUNCTION_PROJECT_ID;
  const apiKey = req.headers['x-appwrite-key'] || env.APPWRITE_API_KEY;
  const databaseId = env.APPWRITE_DATABASE_ID;
  const tableId = env.APPWRITE_USER_ACCOUNTS_TABLE_ID;
  if (!endpoint || !projectId || !apiKey || !databaseId || !tableId) {
    error(
      'delete-account is missing configuration: check APPWRITE_DATABASE_ID, ' +
        'APPWRITE_USER_ACCOUNTS_TABLE_ID and the function scopes.',
    );
    return res.json(
      {
        error:
          "Account deletion isn't set up correctly yet. Please contact support.",
      },
      500,
    );
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': projectId,
    'X-Appwrite-Key': apiKey,
  };
  const remove = path =>
    fetch(`${endpoint}${path}`, { method: 'DELETE', headers });
  const id = encodeURIComponent;

  // The profile goes first: if deleting the account then fails, the user can retry
  // and nothing about them is left behind. A missing profile is fine.
  const profile = await remove(
    `/tablesdb/${id(databaseId)}/tables/${id(tableId)}/rows/${id(userId)}`,
  );
  if (!profile.ok && profile.status !== 404) {
    error(
      `Deleting profile of ${userId} failed (${
        profile.status
      }): ${await profile.text()}`,
    );
    return res.json(
      { error: "We couldn't delete your data. Please try again." },
      502,
    );
  }

  const account = await remove(`/users/${id(userId)}`);
  if (!account.ok && account.status !== 404) {
    error(
      `Deleting account ${userId} failed (${
        account.status
      }): ${await account.text()}`,
    );
    return res.json(
      { error: "We couldn't delete your account. Please try again." },
      502,
    );
  }

  log(`Deleted account ${userId}`);
  return res.json({ deleted: true });
}

module.exports = context =>
  handleDeleteAccount(context, { fetch: globalThis.fetch, env: process.env });
module.exports.handleDeleteAccount = handleDeleteAccount;
