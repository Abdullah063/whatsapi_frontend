export interface ApiViolation {
  field: string;
  message: string;
}

export interface ApiProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  violations?: ApiViolation[];
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ApiProblem,
  ) {
    super(problem.detail || problem.title || `API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

interface CsrfResponse {
  token: string;
  headerName: string;
  parameterName: string;
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const stateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let csrf: CsrfResponse | null = null;
let csrfRequest: Promise<CsrfResponse> | null = null;

async function loadCsrfToken(): Promise<CsrfResponse> {
  if (csrf) return csrf;
  if (!csrfRequest) {
    csrfRequest = fetch(`${baseUrl}/api/v1/auth/csrf`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw await toApiError(response);
        return response.json() as Promise<CsrfResponse>;
      })
      .then((value) => {
        csrf = value;
        return value;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
}

async function toApiError(response: Response): Promise<ApiError> {
  let problem: ApiProblem = {};
  try {
    problem = (await response.json()) as ApiProblem;
  } catch {
    problem = { title: response.statusText || 'Request failed' };
  }
  return new ApiError(response.status, problem);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (stateChangingMethods.has(method)) {
    const token = await loadCsrfToken();
    headers.set(token.headerName, token.token);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  });

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}
