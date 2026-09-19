export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function send(path: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(path, { ...options, credentials: 'same-origin' });
  } catch {
    throw new ApiError('Network request failed. Please check your connection and try again.', 0);
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await send(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  return readResponse<T>(response);
}

export async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const response = await send(path, { method: 'POST', body });

  return readResponse<T>(response);
}
