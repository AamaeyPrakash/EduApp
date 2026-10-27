import config from '../config';
import { databases, Permission, Role } from '../lib/appwrite';

// Each user's profile lives in the UserAccounts collection under their own user ID.

export function fetchProfile(userId) {
  return databases.getDocument(
    config.databaseId,
    config.userAccountsCollectionId,
    userId,
  );
}

// `age` and `school` are no longer asked for. They're saved empty, which clears values
// left by older versions. Appwrite rejects fields a collection doesn't define, so the
// collection keeps both attributes.
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

// Creates the profile, or updates it if a document for this user already exists.
// Only the owner can read or change their profile; nobody else gets access.
export async function saveProfile(user, details) {
  const data = toProfileData(user, details);
  const permissions = [
    Permission.read(Role.user(user.$id)),
    Permission.update(Role.user(user.$id)),
  ];
  try {
    return await databases.createDocument(
      config.databaseId,
      config.userAccountsCollectionId,
      user.$id,
      data,
      permissions,
    );
  } catch (error) {
    if (error?.type !== 'document_already_exists') {
      throw error;
    }
    return databases.updateDocument(
      config.databaseId,
      config.userAccountsCollectionId,
      user.$id,
      data,
    );
  }
}
