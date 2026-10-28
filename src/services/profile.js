import config from '../config';
import { Permission, Role, tablesDB } from '../lib/appwrite';

// Each user's profile is a row in the UserAccounts table, under their own user ID.

export function fetchProfile(userId) {
  return tablesDB.getRow({
    databaseId: config.databaseId,
    tableId: config.userAccountsTableId,
    rowId: userId,
  });
}

// `age` and `school` are no longer asked for. They're saved empty, which clears values
// left by older versions. Appwrite rejects fields a table doesn't define, so the table
// keeps both columns.
export function toProfileData(user, details) {
  return {
    userId: user.$id,
    email: user.email,
    name: details.name.trim(),
    age: '',
    grade: String(details.grade).trim(),
    school: '',
    educationBoard: details.educationBoard,
  };
}

// Creates the profile, or updates it if a row for this user already exists.
// Only the owner can read or change their profile; nobody else gets access.
export async function saveProfile(user, details) {
  const data = toProfileData(user, details);
  const permissions = [
    Permission.read(Role.user(user.$id)),
    Permission.update(Role.user(user.$id)),
  ];
  try {
    return await tablesDB.createRow({
      databaseId: config.databaseId,
      tableId: config.userAccountsTableId,
      rowId: user.$id,
      data,
      permissions,
    });
  } catch (error) {
    if (error?.type !== 'row_already_exists') {
      throw error;
    }
    return tablesDB.updateRow({
      databaseId: config.databaseId,
      tableId: config.userAccountsTableId,
      rowId: user.$id,
      data,
    });
  }
}
