import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// In-memory fallback ONLY for web preview (never AsyncStorage per BR-AUTH-002)
const webMemoryFallback = new Map<string, string>();

// Explicit SecureStoreOptions populate every @Field of Expo SDK 57 @OptimizedRecord
// and isolate our keys under dedicated Android KeyStore aliases so a corrupted legacy
// `key_v1` entry never permanently breaks persistence on Xiaomi/HyperOS devices.
const PRIMARY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'aitutor_auth_v2',
  requireAuthentication: false,
  authenticationPrompt: ' ',
};

const FALLBACK_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'aitutor_auth_v3',
  requireAuthentication: false,
  authenticationPrompt: ' ',
};

const LEGACY_OPTIONS: SecureStore.SecureStoreOptions = {};

// Single global FIFO queue across authStore + themeStore so Android KeyStore
// never sees concurrent AES-GCM cipher/alias creation calls on startup or login.
let secureStoreQueue: Promise<unknown> = Promise.resolve();
let lastStorageDiagnostic = 'init';

export function getStorageDiagnostic(): string {
  return lastStorageDiagnostic;
}

function formatErr(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message.slice(0, 90);
  }
  return String(err).slice(0, 90);
}

function enqueueSecureOp<T>(op: () => Promise<T>): Promise<T> {
  const next = secureStoreQueue.then(op, op);
  secureStoreQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function tryGetWithOptions(
  key: string,
  options: SecureStore.SecureStoreOptions,
): Promise<string | null> {
  try {
    const val = await SecureStore.getItemAsync(key, options);
    if (val !== null) return val;
  } catch {
    // Fall through to sync API
  }
  try {
    if (typeof SecureStore.getItem === 'function') {
      const syncVal = SecureStore.getItem(key, options);
      if (syncVal !== null) return syncVal;
    }
  } catch {
    // Ignore and let caller try next alias
  }
  return null;
}

async function trySetAndVerify(
  key: string,
  value: string,
  options: SecureStore.SecureStoreOptions,
  tag: string,
): Promise<{ ok: boolean; error?: string }> {
  let asyncErr: string | undefined;
  try {
    await SecureStore.setItemAsync(key, value, options);
    const verified = await SecureStore.getItemAsync(key, options);
    if (verified === value) {
      lastStorageDiagnostic = `OK:${tag}-async`;
      return { ok: true };
    }
    asyncErr = 'readback-null';
  } catch (err) {
    asyncErr = formatErr(err);
  }

  // Fallback to synchronous native SecureStore bridge
  try {
    if (typeof SecureStore.setItem === 'function') {
      SecureStore.setItem(key, value, options);
      const verifiedSync =
        typeof SecureStore.getItem === 'function'
          ? SecureStore.getItem(key, options)
          : await SecureStore.getItemAsync(key, options);
      if (verifiedSync === value) {
        lastStorageDiagnostic = `OK:${tag}-sync`;
        return { ok: true };
      }
      return { ok: false, error: asyncErr || 'sync-readback-null' };
    }
  } catch (err) {
    return { ok: false, error: `${asyncErr || 'async-err'} | sync:${formatErr(err)}` };
  }

  return { ok: false, error: asyncErr || 'write-failed' };
}

export async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webMemoryFallback.get(key) ?? null;
  }
  return enqueueSecureOp(async () => {
    const fromPrimary = await tryGetWithOptions(key, PRIMARY_OPTIONS);
    if (fromPrimary !== null) {
      lastStorageDiagnostic = 'OK:v2-read';
      return fromPrimary;
    }

    const fromFallback = await tryGetWithOptions(key, FALLBACK_OPTIONS);
    if (fromFallback !== null) {
      lastStorageDiagnostic = 'OK:v3-read';
      return fromFallback;
    }

    const fromLegacy = await tryGetWithOptions(key, LEGACY_OPTIONS);
    if (fromLegacy !== null) {
      lastStorageDiagnostic = 'OK:legacy-read';
      return fromLegacy;
    }

    return null;
  });
}

export async function secureSet(key: string, value: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    webMemoryFallback.set(key, value);
    lastStorageDiagnostic = 'OK:web-mem';
    return true;
  }
  return enqueueSecureOp(async () => {
    const primary = await trySetAndVerify(key, value, PRIMARY_OPTIONS, 'v2');
    if (primary.ok) return true;

    const fallback = await trySetAndVerify(key, value, FALLBACK_OPTIONS, 'v3');
    if (fallback.ok) return true;

    const legacy = await trySetAndVerify(key, value, LEGACY_OPTIONS, 'v1');
    if (legacy.ok) return true;

    lastStorageDiagnostic = `ERR:${primary.error || fallback.error || legacy.error || 'unknown'}`;
    return false;
  });
}

export async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryFallback.delete(key);
    return;
  }
  await enqueueSecureOp(async () => {
    for (const opts of [PRIMARY_OPTIONS, FALLBACK_OPTIONS, LEGACY_OPTIONS]) {
      try {
        await SecureStore.deleteItemAsync(key, opts);
      } catch {
        // Ignore cleanup errors for absent aliases
      }
    }
  });
}
