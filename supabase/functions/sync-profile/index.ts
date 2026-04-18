import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { assertSafeNickname } from '../_shared/validation.ts';

type SyncProfilePayload = {
  avatarId: string;
  locale: 'en' | 'ru' | 'uk';
  nickname: string;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<SyncProfilePayload>(request);
    const nickname = assertSafeNickname(body.nickname);

    const { error } = await serviceClient.from('guest_profiles').upsert({
      avatar_id: body.avatarId,
      id: user.id,
      locale: body.locale,
      nickname,
    });

    if (error) {
      throw error;
    }

    return jsonResponse({
      profileId: user.id,
      synced: true,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown sync-profile failure.',
      },
      400
    );
  }
});
