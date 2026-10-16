import { useEffect, useRef, useState } from 'react';

import { useAppStore } from '../../state/app-store';
import { subscribeToRoomChannel, type RoomRealtimeEvent } from './realtime-room-channel';
import type { ActiveRoom } from './types';

/** Live room channel for a screen: online players, who answered which question, room events. */
export function useRoomChannel(room: ActiveRoom | undefined, onRoomEvent?: (event: RoomRealtimeEvent) => void) {
  const nickname = useAppStore((state) => state.profile?.nickname ?? '');
  const [isLive, setIsLive] = useState(false);
  const [onlinePlayerIds, setOnlinePlayerIds] = useState<string[]>([]);
  const [answeredByQuestionId, setAnsweredByQuestionId] = useState<Record<string, string[]>>({});
  const onRoomEventRef = useRef(onRoomEvent);
  const roomId = room?.id;
  const roomCode = room?.roomCode;
  const localPlayerId = room?.participants.find((participant) => participant.isLocalPlayer)?.id;

  useEffect(() => {
    onRoomEventRef.current = onRoomEvent;
  }, [onRoomEvent]);

  useEffect(() => {
    if (!roomId || !roomCode || !localPlayerId) {
      return undefined;
    }

    return subscribeToRoomChannel(
      { id: roomId, roomCode },
      { nickname, playerId: localPlayerId },
      {
        onAnswerProgress: ({ playerId, questionId }) =>
          setAnsweredByQuestionId((current) =>
            current[questionId]?.includes(playerId)
              ? current
              : { ...current, [questionId]: [...(current[questionId] ?? []), playerId] }
          ),
        onPresence: setOnlinePlayerIds,
        onRoomEvent: (event) => onRoomEventRef.current?.(event),
        onStatus: setIsLive,
      }
    );
  }, [localPlayerId, nickname, roomCode, roomId]);

  return { answeredByQuestionId, isLive, onlinePlayerIds };
}
