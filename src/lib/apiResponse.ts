export interface ApiResponse<T> {
    code: number;
    errorCode?: string | null;
    message: string;
    data: T;
    errors: Record<string, string>;
    timestamp: string;
}

export function unwrapApi<T>(value: unknown): T {
    if (typeof value === 'object' && value !== null && 'code' in value && 'data' in value
        && typeof value.code === 'number' && value.code >= 200 && value.code < 300) {
        return value.data as T;
    }
    return value as T;
}

export async function readApi<T = unknown>(response: Response): Promise<T> {
    return unwrapApi<T>(await response.json());
}

export class ApiError extends Error {
    constructor(message: string, public readonly status: number, public readonly errorCode: string | null,
                public readonly errors: Record<string, string> = {}) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function checkedResponse(response: Response): Promise<Response> {
    if (response.ok) return response;
    const body = await response.json().catch(() => null) as Partial<ApiResponse<unknown>> | null;
    const fields: Record<string, string> = {};
    if (body?.errors && typeof body.errors === 'object') {
        for (const [field, message] of Object.entries(body.errors)) if (typeof message === 'string') fields[field] = message;
    }
    throw new ApiError(typeof body?.message === 'string' ? body.message : 'Không nhận được phản hồi hợp lệ từ máy chủ. Vui lòng thử lại.',
        response.status, typeof body?.errorCode === 'string' ? body.errorCode : null, fields);
}

export async function readResult<T>(response: Response): Promise<ApiResponse<T>> {
    await checkedResponse(response);
    const text = await response.text();
    const body: unknown = text ? JSON.parse(text) : undefined;
    if (body && typeof body === 'object' && 'code' in body && 'data' in body && 'message' in body) return body as ApiResponse<T>;
    return {code: response.status, message: '', data: body as T, errors: {}, timestamp: ''};
}

export function errorMessage(error: unknown): string {
    if (error instanceof ApiError) return [...new Set([error.message, ...Object.values(error.errors)])].filter(Boolean).join(' ');
    if (error instanceof TypeError || (error instanceof DOMException && ['AbortError', 'TimeoutError'].includes(error.name)))
        return 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối rồi thử lại.';
    return error instanceof Error ? error.message : 'Không thể hoàn tất kết nối. Vui lòng thử lại.';
}
