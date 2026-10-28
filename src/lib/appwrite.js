import {
  Account,
  Client,
  Functions,
  ID,
  Permission,
  Role,
  TablesDB,
} from 'appwrite';
import config, { missingConfigKeys } from '../config';

const client = new Client();

// The app shows a setup screen instead of calling Appwrite when settings are missing,
// so the client is only configured once everything it needs is present.
if (missingConfigKeys.length === 0) {
  client
    .setEndpoint(config.appwriteEndpoint)
    .setProject(config.appwriteProjectId);
}

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const functions = new Functions(client);

export { ID, Permission, Role };
