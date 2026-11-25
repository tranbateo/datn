import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

export function useColorScheme(): 'light' | 'dark' {
  const preference = useThemeStore((s) => s.preference);
  const systemScheme = useRNColorScheme();

  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}
