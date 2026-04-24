export type HomeRoomPanelStrings = {
  activeRoomCopy: string;
  activeRoomTitle: string;
  roomCardCopy: string;
  roomCardTitle: string;
};

export function getHomeRoomPanelModel(input: {
  hasActiveRoom: boolean;
  strings: HomeRoomPanelStrings;
}) {
  if (input.hasActiveRoom) {
    return {
      actionVariant: 'primary' as const,
      copy: input.strings.activeRoomCopy,
      title: input.strings.activeRoomTitle,
    };
  }

  return {
    actionVariant: 'secondary' as const,
    copy: input.strings.roomCardCopy,
    title: input.strings.roomCardTitle,
  };
}
