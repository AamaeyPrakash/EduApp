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

export function toProfileData(user, details) {
  return {
    userId: user.$id,
    email: user.email,
    name: details.name.trim(),
    age: String(details.age).trim(),
    grade: String(details.grade).trim(),
    school: details.school.trim(),
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
