// Server-side broadcasts on the private room channel `room:<room id>` (Realtime REST API).
// Best effort: a lost broadcast only delays the UI, the database stays the source of truth.

export function roomTopic(roomId: string) {
  return `room:${roomId}`;
}

export async function broadcastToRoom(roomId: string, event: string, payload: Record<string, unknown>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      body: JSON.stringify({ messages: [{ event, payload, private: true, topic: roomTopic(roomId) }] }),
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      console.error(`Realtime broadcast ${event} failed with ${response.status}`);
    }
  } catch (error) {
    console.error(error);
  }
}
