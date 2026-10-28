/**
 * @jest-environment node
 */
const {
  handleDeleteAccount,
} = require('../../appwrite/functions/delete-account/src/main');

const ENV = {
  APPWRITE_FUNCTION_API_ENDPOINT: 'https://appwrite.test/v1/',
  APPWRITE_FUNCTION_PROJECT_ID: 'project',
  APPWRITE_DATABASE_ID: 'db',
  APPWRITE_USER_ACCOUNTS_TABLE_ID: 'profiles',
};

function makeContext({
  userId = 'user-1',
  apiKey = 'dynamic-key',
  method = 'POST',
} = {}) {
  const errors = [];
  return {
    errors,
    context: {
      req: {
        method,
        headers: {
          'x-appwrite-user-id': userId,
          'x-appwrite-key': apiKey,
        },
      },
      res: { json: (data, statusCode = 200) => ({ data, statusCode }) },
      log: () => {},
      error: message => errors.push(message),
    },
  };
}

const response = status => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => `status ${status}`,
});

describe('delete-account function', () => {
  it("deletes the caller's profile and then their account", async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(response(204))
      .mockResolvedValueOnce(response(204));
    const { context } = makeContext();

    const result = await handleDeleteAccount(context, { fetch, env: ENV });

    expect(result).toEqual({ data: { deleted: true }, statusCode: 200 });
    expect(
      fetch.mock.calls.map(([url, options]) => [options.method, url]),
    ).toEqual([
      [
        'DELETE',
        'https://appwrite.test/v1/tablesdb/db/tables/profiles/rows/user-1',
      ],
      ['DELETE', 'https://appwrite.test/v1/users/user-1'],
    ]);
    expect(fetch.mock.calls[0][1].headers).toMatchObject({
      'X-Appwrite-Project': 'project',
      'X-Appwrite-Key': 'dynamic-key',
    });
  });

  it('still deletes the account when there is no profile', async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(response(404))
      .mockResolvedValueOnce(response(204));
    const { context } = makeContext();

    const result = await handleDeleteAccount(context, { fetch, env: ENV });

    expect(result.data).toEqual({ deleted: true });
  });

  it('stops if the profile could not be deleted', async () => {
    const fetch = jest.fn().mockResolvedValueOnce(response(500));
    const { context, errors } = makeContext();

    const result = await handleDeleteAccount(context, { fetch, env: ENV });

    expect(result.statusCode).toBe(502);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(errors[0]).toMatch(/500/);
  });

  it('reports a failure to delete the account', async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(response(204))
      .mockResolvedValueOnce(response(401));
    const { context } = makeContext();

    const result = await handleDeleteAccount(context, { fetch, env: ENV });

    expect(result.statusCode).toBe(502);
  });

  it('requires a signed-in caller', async () => {
    const fetch = jest.fn();
    const { context } = makeContext({ userId: '' });

    const result = await handleDeleteAccount(context, { fetch, env: ENV });

    expect(result.statusCode).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('only accepts POST', async () => {
    const { context } = makeContext({ method: 'GET' });
    const result = await handleDeleteAccount(context, {
      fetch: jest.fn(),
      env: ENV,
    });
    expect(result.statusCode).toBe(405);
  });

  it('reports missing configuration', async () => {
    const fetch = jest.fn();
    const { context, errors } = makeContext({ apiKey: '' });

    const result = await handleDeleteAccount(context, { fetch, env: ENV });

    expect(result.statusCode).toBe(500);
    expect(errors[0]).toMatch(/missing configuration/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('falls back to an API key variable on older Appwrite versions', async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(response(204))
      .mockResolvedValueOnce(response(204));
    const { context } = makeContext({ apiKey: '' });

    await handleDeleteAccount(context, {
      fetch,
      env: { ...ENV, APPWRITE_API_KEY: 'static-key' },
    });

    expect(fetch.mock.calls[0][1].headers['X-Appwrite-Key']).toBe('static-key');
  });
});
