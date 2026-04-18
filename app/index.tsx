import { Redirect } from 'expo-router';

import { LoadingScreen } from '../src/components/ui/loading-screen';
import { useAppStore } from '../src/state/app-store';

export default function IndexRoute() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const profile = useAppStore((state) => state.profile);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return <Redirect href={profile ? '/home' : '/onboarding'} />;
}
