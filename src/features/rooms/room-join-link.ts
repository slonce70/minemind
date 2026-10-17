// A room's join link and QR code: `<web>/rooms?join=AB12CD` (or minemind://rooms?join=...). Any phone
// camera opens it; the in-app scanner reads it too, as well as a bare six-character code.
const roomCodePattern = /^[A-Z0-9]{6}$/;

export function buildRoomJoinUrl(base: string, roomCode: string) {
  const path = `rooms?join=${encodeURIComponent(roomCode)}`;

  return base.endsWith('://') ? `${base}${path}` : `${base.replace(/\/+$/, '')}/${path}`;
}

/** The room code in a scanned or pasted text; null when there is none. */
export function parseRoomCode(input: string | undefined | null): string | null {
  const text = input?.trim() ?? '';
  const bare = text.toUpperCase();

  if (roomCodePattern.test(bare)) {
    return bare;
  }

  const match = text.match(/[?&]join=([A-Za-z0-9]{6})(?:&|#|$)/);

  return match ? match[1].toUpperCase() : null;
}
