// Bots and invented opponents exist only to try the room flow during development.
// React Native sets the global __DEV__ (false in release bundles); node tests have none.
export const isDemoPlayersEnabled = (globalThis as { __DEV__?: boolean }).__DEV__ === true;
