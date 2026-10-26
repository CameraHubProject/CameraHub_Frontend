import {afterEach, describe, expect, it, vi} from 'vitest';
import {
    confirmGoogleLink,
    currentAccount,
    googleLoginStatus,
    login,
    logout,
    updateProfile
} from './identity';

afterEach(() => vi.unstubAllGlobals());
describe('identity requests', () => {
    it('submits phone identifiers through the existing login endpoint without changing the password', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(Response.json({headerName: 'X-CSRF-TOKEN', token: 'phone-token'}))
            .mockResolvedValueOnce(new Response(null, {status: 204}));
        vi.stubGlobal('fetch', fetcher);
        await login(' +84 912 345 678 ', '  password-with-spaces  ');
        expect(fetcher.mock.calls[1][0]).toBe('/api/auth/login');
        expect(fetcher.mock.calls[1][1].body.get('email')).toBe('+84 912 345 678');
        expect(fetcher.mock.calls[1][1].body.get('password')).toBe('  password-with-spaces  ');
    });
    it('reads Google availability without sending client credentials', async () => {
        const fetcher = vi.fn().mockResolvedValue(Response.json({enabled: true, pendingEmail: null}));
        vi.stubGlobal('fetch', fetcher);
        await expect(googleLoginStatus()).resolves.toEqual({enabled: true, pendingEmail: null});
        expect(fetcher.mock.calls[0][0]).toBe('/api/auth/google/status');
        expect(fetcher.mock.calls[0][1].credentials).toBe('same-origin');
    });
    it('confirms linking using server session and CSRF, never an email or Google subject from the browser', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(Response.json({headerName: 'X-CSRF-TOKEN', token: 'link-token'}))
            .mockResolvedValueOnce(new Response(null, {status: 204}));
        vi.stubGlobal('fetch', fetcher);
        await confirmGoogleLink('existing-password');
        expect(fetcher.mock.calls[1][0]).toBe('/api/auth/google/link');
        expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({password: 'existing-password'});
        expect(fetcher.mock.calls[1][1].headers['X-CSRF-TOKEN']).toBe('link-token');
    });
    it('uses the backend OAuth message and only sends the reason identifier', async () => {
        const fetcher=vi.fn().mockResolvedValue(Response.json({enabled:true,pendingEmail:null,message:'Thông báo do backend quyết định.'}));
        vi.stubGlobal('fetch',fetcher);
        expect((await googleLoginStatus('cancelled')).message).toBe('Thông báo do backend quyết định.');
        expect(fetcher.mock.calls[0][0]).toBe('/api/auth/google/status?reason=cancelled');
    });
    it('treats only 401 as logged out and reports server failure', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(new Response('', {status: 401})).mockResolvedValueOnce(new Response('', {status: 503}));
        vi.stubGlobal('fetch', fetcher);
        await expect(currentAccount()).resolves.toBeNull();
        await expect(currentAccount()).rejects.toThrow();
    });
    it('obtains a fresh CSRF token for login and logout without saving credentials', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(Response.json({
            headerName: 'X-CSRF-TOKEN',
            token: 'before-login'
        }))
            .mockResolvedValueOnce(new Response(null, {status: 204}))
            .mockResolvedValueOnce(Response.json({headerName: 'X-CSRF-TOKEN', token: 'after-login'}))
            .mockResolvedValueOnce(new Response(null, {status: 204}));
        vi.stubGlobal('fetch', fetcher);
        await login('buyer@example.invalid', 'test-password-long');
        await logout();
        expect(fetcher.mock.calls[1][1].headers['X-CSRF-TOKEN']).toBe('before-login');
        expect(fetcher.mock.calls[1][1].body.get('email')).toBe('buyer@example.invalid');
        expect(fetcher.mock.calls[3][1].headers['X-CSRF-TOKEN']).toBe('after-login');
        expect(fetcher.mock.calls[3][1].credentials).toBe('same-origin');
    });
    it('does not send a mutation when CSRF bootstrap fails', async () => {
        const fetcher = vi.fn().mockResolvedValue(new Response('', {status: 503}));
        vi.stubGlobal('fetch', fetcher);
        await expect(login('a@b.invalid', 'test-password-long')).rejects.toThrow();
        expect(fetcher).toHaveBeenCalledTimes(1);
    });
    it('updates only the personal profile and displays duplicate-phone rejection', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(Response.json({
            headerName: 'X-CSRF-TOKEN',
            token: 'upload-token'
        }))
            .mockResolvedValueOnce(Response.json({message: 'Số điện thoại đã được sử dụng.'}, {status: 409}));
        vi.stubGlobal('fetch', fetcher);
        await expect(updateProfile({
            fullName: 'Tên mới',
            phone: '0912345678'
        })).rejects.toThrow('Số điện thoại đã được sử dụng.');
        expect(fetcher.mock.calls[1][0]).toBe('/api/auth/me');
        expect(fetcher.mock.calls[1][1].headers['X-CSRF-TOKEN']).toBe('upload-token');
        expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({fullName: 'Tên mới', phone: '0912345678'});
    });
});
