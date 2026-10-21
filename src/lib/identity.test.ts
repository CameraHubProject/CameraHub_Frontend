import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentAccount, login, logout, submitVerification } from './identity';

afterEach(() => vi.unstubAllGlobals());
describe('identity requests', () => {
  it('treats only 401 as logged out and reports server failure', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 401 })).mockResolvedValueOnce(new Response('', { status: 503 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(currentAccount()).resolves.toBeNull();
    await expect(currentAccount()).rejects.toThrow();
  });
  it('obtains a fresh CSRF token for login and logout without saving credentials', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ headerName: 'X-CSRF-TOKEN', token: 'before-login' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ headerName: 'X-CSRF-TOKEN', token: 'after-login' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetcher);
    await login('buyer@example.invalid', 'test-password-long'); await logout();
    expect(fetcher.mock.calls[1][1].headers['X-CSRF-TOKEN']).toBe('before-login');
    expect(fetcher.mock.calls[1][1].body.get('email')).toBe('buyer@example.invalid');
    expect(fetcher.mock.calls[3][1].headers['X-CSRF-TOKEN']).toBe('after-login');
    expect(fetcher.mock.calls[3][1].credentials).toBe('same-origin');
  });
  it('does not send a mutation when CSRF bootstrap fails', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 503 })); vi.stubGlobal('fetch', fetcher);
    await expect(login('a@b.invalid', 'test-password-long')).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('leaves multipart boundaries to the browser and displays backend rejection', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ headerName: 'X-CSRF-TOKEN', token: 'upload-token' }))
      .mockResolvedValueOnce(Response.json({ message: 'Hồ sơ đang chờ duyệt.' }, { status: 409 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(submitVerification(new File(['fixture'], 'evidence.pdf'))).rejects.toThrow('Hồ sơ đang chờ duyệt.');
    expect(fetcher.mock.calls[1][1].headers['Content-Type']).toBeUndefined();
    expect(fetcher.mock.calls[1][1].body).toBeInstanceOf(FormData);
  });
});
