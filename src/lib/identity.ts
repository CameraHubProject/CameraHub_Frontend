import {readApi, readResult, checkedResponse as checked} from './apiResponse';
export type AccountRole = 'USER' | 'ADMIN';
export interface Account {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    avatarUrl?: string | null;
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


export function validateAvatar(file: File): string | null {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) return 'Chỉ chấp nhận JPG, PNG hoặc WebP.';
    if (!file.size || file.size > 2 * 1024 * 1024) return 'Ảnh phải có dung lượng từ 1 byte đến 2 MB.';
    return null;
}

export async function uploadAvatar(file: File) {
    const error = validateAvatar(file);
    if (error) throw new Error(error);
    const data = new FormData();
    data.append('file', file);
    return readResult<Account>(await mutate('/api/auth/me/avatar', data));
}

export function validatePasswordChange(data: {currentPassword: string; newPassword: string; confirmPassword: string}): string | null {
    if (!data.currentPassword) return 'Vui lòng nhập mật khẩu hiện tại.';
    if (data.newPassword.length < 12 || new TextEncoder().encode(data.newPassword).length > 72) return 'Mật khẩu cần ít nhất 12 ký tự và tối đa 72 byte UTF-8.';
    if (data.newPassword === data.currentPassword) return 'Mật khẩu mới phải khác mật khẩu hiện tại.';
    if (data.newPassword !== data.confirmPassword) return 'Xác nhận mật khẩu không khớp.';
    return null;
}

export async function changePassword(data: {currentPassword: string; newPassword: string; confirmPassword: string}) {
    const error = validatePasswordChange(data);
    if (error) throw new Error(error);
    return readResult<null>(await mutate('/api/auth/me/password', JSON.stringify(data), 'application/json'));
}
