import { serviceClient } from './client.ts';
import { GameError } from './error-codes.ts';

export async function requireAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new GameError('unauthorized', 'Missing bearer token.');
  }

  const jwt = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await serviceClient.auth.getUser(jwt);

  if (error || !user) {
    throw new GameError('unauthorized', 'Unable to authenticate user.');
  }

  return user;
}
