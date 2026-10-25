// Appwrite returns function responses as an execution record with the body as a string.
export function readExecution(execution) {
  let body = {};
  if (execution && execution.responseBody) {
    try {
      body = JSON.parse(execution.responseBody) || {};
    } catch {
      body = {};
    }
  }
  return {
    statusCode: (execution && execution.responseStatusCode) || 0,
    body,
  };
}
