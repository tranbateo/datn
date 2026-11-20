import { API_ENDPOINTS, getApiBaseUrl } from '@/constants/api';
import { useAuthStore } from '@/store/authStore';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  SCHOOL_SUSPENDED:
    'Tài khoản trường học đang tạm ngưng hoạt động. Vui lòng liên hệ Quản trị viên nhà trường.',
  SCHOOL_LICENSE_EXPIRED:
    'Bản quyền hệ thống của trường đã hết hạn. Vui lòng liên hệ Quản trị viên nhà trường.',
  ACCOUNT_DISABLED:
    'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Giáo viên chủ nhiệm hoặc Nhà trường.',
  MUST_CHANGE_PASSWORD:
    'Bạn cần đổi mật khẩu khởi tạo trước khi sử dụng hệ thống.',
  'Invalid credentials': 'Thông tin đăng nhập hoặc mật khẩu không chính xác.',
  Unauthorized: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
};

export function translateBackendError(raw: string): string {
  if (!raw) return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  for (const [key, vi] of Object.entries(ERROR_TRANSLATIONS)) {
    if (raw === key || raw.includes(key)) {
      return vi;
    }
  }
  return raw;
}

let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refreshToken, updateTokens, logout } = useAuthStore.getState();
    if (!refreshToken) {
      await logout();
      return null;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        await logout();
        return null;
      }

      const data = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!data.accessToken) {
        await logout();
        return null;
      }

      await updateTokens(data.accessToken, data.refreshToken ?? refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {},
  isRetry = false,
): Promise<T> {
  const { timeoutMs = 45_000, skipAuth = false, headers, body, ...rest } = options;
  const token = useAuthStore.getState().token;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const mergedHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string> | undefined),
  };

  if (!skipAuth && token && !mergedHeaders.Authorization) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...rest,
      body,
      headers: mergedHeaders,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Yêu cầu quá thời gian chờ. Vui lòng thử lại.', 408);
    }
    throw new ApiError(
      `Không thể kết nối máy chủ (${getApiBaseUrl()}). Hãy kiểm tra mạng hoặc cấu hình địa chỉ API.`,
      0,
    );
  } finally {
    clearTimeout(timeout);
  }

  // Handle 401 with single refresh-token retry
  if (response.status === 401 && !skipAuth && !isRetry) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      return fetchApi<T>(
        endpoint,
        {
          ...options,
          headers: {
            ...(headers as Record<string, string> | undefined),
            Authorization: `Bearer ${newToken}`,
          },
        },
        true,
      );
    }
    throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const rawText = await response.text();
  let parsed: unknown = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }

  if (!response.ok) {
    const errObj =
      parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    const rawMsg = Array.isArray(errObj?.message)
      ? errObj.message.join(', ')
      : typeof errObj?.message === 'string'
        ? errObj.message
        : typeof parsed === 'string' && parsed.trim()
          ? parsed
          : `Lỗi máy chủ (${response.status})`;
    const code = typeof errObj?.code === 'string' ? errObj.code : undefined;

    if (response.status === 403 && rawMsg.includes('MUST_CHANGE_PASSWORD')) {
      useAuthStore.setState({ mustChangePassword: true });
    }

    throw new ApiError(translateBackendError(rawMsg), response.status, code);
  }

  return parsed as T;
}
