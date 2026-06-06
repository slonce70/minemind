import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('live room lifecycle preserves post-match waiting status and round context', () => {
  const liveRoomServiceSource = readFileSync(
    new URL('../src/features/rooms/live-room-service.ts', import.meta.url),
    'utf8'
  );
  const roomTypesSource = readFileSync(
    new URL('../src/features/rooms/types.ts', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(liveRoomServiceSource, /return status === 'active' \? 'active' : 'lobby';/);
  assert.match(roomTypesSource, /status: 'active' \| 'lobby' \| 'waiting' \| 'finalizing' \| 'finished';/);
  assert.match(liveRoomServiceSource, /roundId:\s*payload\.room\.current_round_id \?\? undefined,/);
});

test('room resume CTAs rely on persisted round context instead of active-only status', () => {
  const homeRouteSource = readFileSync(new URL('../app/home.tsx', import.meta.url), 'utf8');
  const roomsRouteSource = readFileSync(new URL('../app/rooms.tsx', import.meta.url), 'utf8');
  const roomLobbyHookSource = readFileSync(
    new URL('../src/features/rooms/use-room-lobby.ts', import.meta.url),
    'utf8'
  );
  const lobbyViewSource = readFileSync(
    new URL('../src/features/rooms/room-lobby-view.tsx', import.meta.url),
    'utf8'
  );

  assert.match(homeRouteSource, /const canResumeRoom = Boolean\(activeRoomRound && \(!isSupabaseConfigured \|\| activeRoom\?\.roundId\)\);/);
  assert.match(homeRouteSource, /canResumeRoom\s*\?\s*router\.push\('\/solo\?mode=room'\)/);
  assert.match(homeRouteSource, /canResumeRoom\s*\?\s*t\('home\.resumeRoom'\)/);
  assert.match(roomsRouteSource, /const canResumeRound = Boolean\(lobby\.activeRoomRound && \(!isSupabaseConfigured \|\| lobby\.activeRoom\?\.roundId\)\);/);
  assert.match(roomsRouteSource, /canResumeRound=\{canResumeRound\}/);
  assert.match(roomsRouteSource, /canResumeRound\s*\?\s*t\('rooms\.resumeBattle'\)/);
  assert.match(roomLobbyHookSource, /if \(\(room\.status === 'lobby' \|\| room\.status === 'finished'\) && activeRoomRound\) \{/);
  assert.match(roomLobbyHookSource, /const canResumeRound = Boolean\(activeRoomRound && \(!isSupabaseConfigured \|\| activeRoom\?\.roundId\)\);/);
  assert.match(roomLobbyHookSource, /if \(canResumeRound\) \{/);
  assert.match(lobbyViewSource, /const isStartDisabled = isBusy \|\| \(!canResumeRound && !lobbyState\?\.canStart\);/);
});

test('solo room recovery resumes post-match rounds beyond active status', () => {
  const soloRoundSource = readFileSync(
    new URL('../src/features/quiz/use-solo-round.ts', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(soloRoundSource, /currentRoom\.status !== 'active'/);
  assert.match(soloRoundSource, /!currentRoom\.roundId/);
  assert.match(soloRoundSource, /currentRoom\.status === 'lobby'/);
  assert.match(soloRoundSource, /currentRoom\.status === 'finished'/);
  assert.match(soloRoundSource, /currentRoomRound\?\.source === 'supabase'/);
});

test('post-match room difficulty follows the next selected difficulty instead of stale room settings', () => {
  const appStoreSource = readFileSync(new URL('../src/state/app-store.ts', import.meta.url), 'utf8');
  const roomLobbyViewSource = readFileSync(
    new URL('../src/features/rooms/room-lobby-view.tsx', import.meta.url),
    'utf8'
  );

  assert.match(appStoreSource, /state\.activeRoom && state\.activeRoom\.status !== 'active'/);
  assert.match(
    roomLobbyViewSource,
    /const displayedDifficulty = activeRoom\?\.status === 'active' \? activeRoom\.settings\.difficulty : selectedDifficulty;/
  );
  assert.match(roomLobbyViewSource, /label=\{difficultyStrings\[displayedDifficulty\]\}/);
  assert.match(roomLobbyViewSource, /selectedDifficulty=\{displayedDifficulty\}/);
});

test('waiting room results keep supabase round context long enough to recover finalized results', () => {
  const roomLobbyHookSource = readFileSync(
    new URL('../src/features/rooms/use-room-lobby.ts', import.meta.url),
    'utf8'
  );
  const soloRoundSource = readFileSync(
    new URL('../src/features/quiz/use-solo-round.ts', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(
    roomLobbyHookSource,
    /if \(\(!room\.roundId \|\| room\.status === 'lobby' \|\| room\.status === 'finished'\) && activeRoomRound\) \{/
  );
  assert.doesNotMatch(
    soloRoundSource,
    /if \(\s*currentRoomRound\?\.source === 'supabase' &&\s*\(!currentRoom\.roundId \|\| currentRoom\.status === 'lobby' \|\| currentRoom\.status === 'finished'\)\s*\) \{\s*clearActiveRound\(\);/s
  );
  assert.match(soloRoundSource, /const isRecoveringWaitingRoom = Boolean\(/);
  assert.match(soloRoundSource, /finalizeLiveRoomRound\(currentRoomRound\)/);
});

test('live room server lifecycle starts in lobby and persists finalization snapshots', () => {
  const createRoomSource = readFileSync(
    new URL('../supabase/functions/create-room/index.ts', import.meta.url),
    'utf8'
  );
  const finalizeRoundSource = readFileSync(
    new URL('../supabase/functions/finalize-round/index.ts', import.meta.url),
    'utf8'
  );
  const migrationSource = readFileSync(
    new URL('../supabase/migrations/20260419_room_realtime_and_results.sql', import.meta.url),
    'utf8'
  );
  const finalizeTransactionSource = readFileSync(
    new URL('../supabase/migrations/20260606_complete_room_round_transaction.sql', import.meta.url),
    'utf8'
  );

  assert.match(createRoomSource, /status:\s*'lobby'/);
  assert.match(migrationSource, /alter table public\.rooms\s+alter column status set default 'lobby';/);
  assert.match(finalizeRoundSource, /status:\s*'finalizing'/);
  assert.match(finalizeRoundSource, /complete_room_round/);
  assert.match(finalizeTransactionSource, /finalized_at = coalesce\(finalized_at, now\(\)\)/);
  assert.match(finalizeTransactionSource, /result_snapshot = ranking_snapshot/);
});

test('finalize round completes result persistence through an idempotent database transaction', () => {
  const finalizeRoundSource = readFileSync(
    new URL('../supabase/functions/finalize-round/index.ts', import.meta.url),
    'utf8'
  );
  const finalizeTransactionSource = readFileSync(
    new URL('../supabase/migrations/20260606_complete_room_round_transaction.sql', import.meta.url),
    'utf8'
  );

  assert.match(finalizeRoundSource, /serviceClient\.rpc\('complete_room_round'/);
  assert.doesNotMatch(finalizeRoundSource, /\.from\('match_results'\)\.insert\(ranking\)/);
  assert.doesNotMatch(finalizeRoundSource, /touch_leaderboard_entry[\s\S]*target_scope:\s*'all_time'/);
  assert.match(finalizeTransactionSource, /on conflict \(round_id, player_id\) do nothing/);
  assert.match(finalizeTransactionSource, /if found then[\s\S]*touch_leaderboard_entry/);
  assert.match(finalizeTransactionSource, /update public\.rooms[\s\S]*status = 'waiting'/);
  assert.match(finalizeTransactionSource, /update public\.room_participants[\s\S]*ready_state = false/);
  assert.match(finalizeTransactionSource, /revoke all on function public\.complete_room_round\(uuid, uuid, jsonb, jsonb\) from authenticated/);
  assert.match(finalizeTransactionSource, /grant execute on function public\.complete_room_round\(uuid, uuid, jsonb, jsonb\) to service_role/);
  assert.match(finalizeTransactionSource, /revoke all on function public\.touch_leaderboard_entry\(text, uuid, integer\) from authenticated/);
  assert.match(finalizeTransactionSource, /grant execute on function public\.touch_leaderboard_entry\(text, uuid, integer\) to service_role/);
});

test('online room creation and start send canonical match settings', () => {
  const liveRoomServiceSource = readFileSync(
    new URL('../src/features/rooms/live-room-service.ts', import.meta.url),
    'utf8'
  );

  assert.match(liveRoomServiceSource, /createLiveRoom\(profile: GuestProfile, settings: RoomMatchSettings\)/);
  assert.match(liveRoomServiceSource, /contentPackVersion: settings\.contentPackVersion/);
  assert.match(liveRoomServiceSource, /difficulty: settings\.difficulty/);
  assert.match(liveRoomServiceSource, /questionCount: settings\.questionCount/);
  assert.match(liveRoomServiceSource, /topicMode: settings\.topicMode/);
  assert.match(liveRoomServiceSource, /updateLiveRoomSettings/);
});

test('room lobby routes difficulty changes through live settings when online', () => {
  const roomLobbyHookSource = readFileSync(
    new URL('../src/features/rooms/use-room-lobby.ts', import.meta.url),
    'utf8'
  );
  const roomsRouteSource = readFileSync(new URL('../app/rooms.tsx', import.meta.url), 'utf8');

  assert.match(roomLobbyHookSource, /handleSelectDifficulty/);
  assert.match(roomLobbyHookSource, /updateLiveRoomSettings/);
  assert.match(roomsRouteSource, /onSelectDifficulty=\{lobby\.handleSelectDifficulty\}/);
});
