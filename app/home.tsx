import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '../src/components/ui/screen';
import { HomeView } from '../src/features/home/home-view';
import { leaderboardPreview, minecraftCategory } from '../src/features/quiz/mock-data';
import { isSupabaseConfigured } from '../src/lib/supabase';
import { useAppStore } from '../src/state/app-store';

export default function HomeRoute() {
  const { t } = useTranslation();
  const profile = useAppStore((state) => state.profile);
  const lastResult = useAppStore((state) => state.lastResult);
  const activeRoom = useAppStore((state) => state.activeRoom);
  const activeRoomRound = useAppStore((state) => state.activeRoomRound);
  const resetProfile = useAppStore((state) => state.resetProfile);

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen scrollable>
      <HomeView
        hasActiveRoom={Boolean(activeRoom)}
        lastResult={lastResult}
        leaderboardEntries={leaderboardPreview}
        localeLabel={t(`languageNames.${profile.locale}`)}
        modeLabel={isSupabaseConfigured ? t('home.onlineReady') : t('home.offlineMode')}
        nickname={profile.nickname}
        onOpenResults={() => router.push('/results')}
        onPlaySolo={() => router.push('/solo')}
        onResetProfile={() => {
          resetProfile();
          router.replace('/onboarding');
        }}
        onRoomAction={() =>
          activeRoom && activeRoom.status === 'active' && activeRoomRound
            ? router.push('/solo?mode=room')
            : router.push('/rooms')
        }
        roomActionLabel={activeRoom ? t('home.resumeRoom') : t('home.privateRooms')}
        strings={{
          activeRoomCopy: activeRoom
            ? t('home.activeRoomCopy', { code: activeRoom.roomCode, count: activeRoom.participants.length })
            : t('home.roomCardCopy'),
          activeRoomTitle: t('home.activeRoom'),
          leaderboardTitle: t('home.leaderboardPreview'),
          localeLabel: t('home.locale'),
          modeLabel: t('home.mode'),
          modeSelectorCopy: t('home.ready'),
          primaryCardCopy: `${t('home.categoryCopy')} ${minecraftCategory.roundQuestionCount} ${t('home.questions').toLowerCase()}, ${minecraftCategory.roundDurationLabel}.`,
          primaryCardTitle: t('home.playSolo'),
          resultTitle: t('home.lastResult'),
          resultsAction: t('home.viewResults'),
          roomCardCopy: t('home.roomCardCopy'),
          roomCardTitle: t('home.roomCardTitle'),
          switchProfile: t('home.switchProfile'),
          title: t('home.greeting', { name: profile.nickname }),
        }}
      />
    </Screen>
  );
}
