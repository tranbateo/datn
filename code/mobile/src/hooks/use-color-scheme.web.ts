import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';

  if (hasHydrated) {
    return colorScheme === 'dark' ? 'dark' : 'light';
  }

  return 'light';
}
