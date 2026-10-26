import {readApi, readResult, checkedResponse as checked} from './apiResponse';
export type AccountRole = 'USER' | 'ADMIN';
export interface Account {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    status: string;
    roles: AccountRole[];
}

export async function currentAccount(): Promise<Account | null> {
    const response = await fetch('/api/auth/me', {credentials: 'same-origin', signal: AbortSignal.timeout(10_000)});
    if (response.status === 401) return null;
    return readApi((await checked(response))) as Promise<Account>;
}

async function mutate(path: string, body: BodyInit, contentType?: string): Promise<Response> {
    // Get a fresh masked token for every mutation, including after login and logout rotation.
    const csrfResponse = await checked(await fetch('/api/auth/csrf', {
        credentials: 'same-origin',
        signal: AbortSignal.timeout(10_000)
    }));
    const csrf = await readApi(csrfResponse) as { headerName: string; token: string };
    if (csrf.headerName !== 'X-CSRF-TOKEN' || !csrf.token) throw new Error('Chưa khởi tạo được phiên bảo mật.');
    return checked(await fetch(path, {
        method: 'POST', credentials: 'same-origin',
        headers: {[csrf.headerName]: csrf.token, ...(contentType ? {'Content-Type': contentType} : {})},
        body, signal: AbortSignal.timeout(30_000)
    }));
}

export async function login(identifier: string, password: string): Promise<void> {
    // Keep the existing API field while accepting either phone or email as its value.
    await mutate('/api/auth/login', new URLSearchParams({
        email: identifier.trim(),
        password
    }), 'application/x-www-form-urlencoded');
}

export async function register(data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    confirmPassword?: string
}): Promise<void> {
    await mutate('/api/auth/register', JSON.stringify(data), 'application/json');
}

export async function logout(): Promise<void> {
    await mutate('/api/auth/logout', '');
}

export async function updateProfile(data: { fullName: string; phone: string }) {
    return readResult<Account>(await mutate('/api/auth/me', JSON.stringify(data), 'application/json'));
}

export interface GoogleLoginStatus {
    enabled: boolean;
    pendingEmail: string | null;
    message: string
}

export async function googleLoginStatus(reason?: string): Promise<GoogleLoginStatus> {
    return readApi((await checked(await fetch('/api/auth/google/status'+(reason?'?reason='+encodeURIComponent(reason):''), {
        credentials: 'same-origin',
        signal: AbortSignal.timeout(10_000)
    })))) as Promise<GoogleLoginStatus>;
}

export async function confirmGoogleLink(password: string): Promise<void> {
    await mutate('/api/auth/google/link', JSON.stringify({password}), 'application/json');
}

