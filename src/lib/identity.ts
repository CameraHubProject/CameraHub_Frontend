export interface Account {
  id: string; email: string; fullName: string; phone: string | null;
  status: string; roles: string[];
}
export interface Verification {
  id: string; sellerId: string; fullName: string;
  status: 'PENDING' | 'VERIFIED' | 'NEEDS_REVISION' | 'REJECTED';
  reviewNote: string | null; createdAt: string; reviewedAt: string | null;
}

async function checked(response: Response): Promise<Response> {
  if (response.ok) return response;
  const error = await response.json().catch(() => null) as { message?: string } | null;
  throw new Error(error?.message ?? (response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' :
    response.status === 403 ? 'Bạn chưa có quyền hoặc phiên bảo mật đã hết hạn. Hãy tải lại trang.' : 'Chưa thực hiện được. Vui lòng thử lại.'));
}

export async function currentAccount(): Promise<Account | null> {
  const response = await fetch('/api/auth/me', { credentials: 'same-origin', signal: AbortSignal.timeout(10_000) });
  if (response.status === 401) return null;
  return (await checked(response)).json() as Promise<Account>;
}

async function mutate(path: string, body: BodyInit, contentType?: string): Promise<Response> {
  // Get a fresh masked token for every mutation, including after login and logout rotation.
  const csrfResponse = await checked(await fetch('/api/auth/csrf', { credentials: 'same-origin', signal: AbortSignal.timeout(10_000) }));
  const csrf = await csrfResponse.json() as { headerName: string; token: string };
  if (csrf.headerName !== 'X-CSRF-TOKEN' || !csrf.token) throw new Error('Chưa khởi tạo được phiên bảo mật.');
  return checked(await fetch(path, { method: 'POST', credentials: 'same-origin',
    headers: { [csrf.headerName]: csrf.token, ...(contentType ? { 'Content-Type': contentType } : {}) },
    body, signal: AbortSignal.timeout(30_000) }));
}

export async function login(email: string, password: string): Promise<void> {
  await mutate('/api/auth/login', new URLSearchParams({ email, password }), 'application/x-www-form-urlencoded');
}
export async function register(data: { email: string; password: string; fullName: string; phone: string }): Promise<void> {
  await mutate('/api/auth/register', JSON.stringify(data), 'application/json');
}
export async function logout(): Promise<void> { await mutate('/api/auth/logout', ''); }
export async function fetchVerifications(admin = false): Promise<Verification[]> {
  return (await checked(await fetch(admin ? '/api/admin/seller-verifications' : '/api/seller-verification',
    { credentials: 'same-origin', signal: AbortSignal.timeout(10_000) }))).json() as Promise<Verification[]>;
}
export async function submitVerification(file: File): Promise<void> {
  const data = new FormData(); data.append('file', file);
  await mutate('/api/seller-verification', data);
}
export async function reviewVerification(id: string, decision: string, note: string): Promise<void> {
  await mutate(`/api/admin/seller-verifications/${encodeURIComponent(id)}/review`, JSON.stringify({ decision, note }), 'application/json');
}
