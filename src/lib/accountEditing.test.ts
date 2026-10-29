import {afterEach, describe, expect, it, vi} from 'vitest';
import {changePassword, uploadAvatar, validateAvatar, validatePasswordChange, updateProfile} from './identity';
afterEach(() => vi.unstubAllGlobals());
const csrf = () => Response.json({headerName: 'X-CSRF-TOKEN', token: 'fresh-token'});
const file = (name = 'avatar.png', type = 'image/png', size = 1) => new File([new Uint8Array(size)], name, {type});
describe('account editing', () => {
    it('accepts JPG PNG WebP and exactly 2 MB', () => {
        for (const [name, type] of [['a.jpg', 'image/jpeg'], ['a.jpeg', 'image/jpeg'], ['a.png', 'image/png'], ['a.webp', 'image/webp']]) expect(validateAvatar(file(name, type))).toBeNull();
        expect(validateAvatar(file('a.png', 'image/png', 2097152))).toBeNull();
    });
    it('rejects wrong extensions, MIME, empty and oversized files before sending', async () => {
        const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
        for (const invalid of [file('a.gif', 'image/gif'), file('a.svg', 'image/png'), file('a.png', 'text/plain'), file('a.png', 'image/png', 0), file('a.png', 'image/png', 2097153)]) await expect(uploadAvatar(invalid)).rejects.toThrow();
        expect(fetcher).not.toHaveBeenCalled();
    });
    it('uploads as multipart with CSRF and receives the new avatar immediately', async () => {
        const account = {id: 'owner', avatarUrl: '/api/auth/me/avatar?key=new-uuid'};
        const fetcher = vi.fn().mockResolvedValueOnce(csrf()).mockResolvedValueOnce(Response.json({code: 200, message: 'Đã lưu', data: account}));
        vi.stubGlobal('fetch', fetcher);
        expect((await uploadAvatar(file())).data).toEqual(account);
        const [path, options] = fetcher.mock.calls[1];
        expect(path).toBe('/api/auth/me/avatar'); expect(options.body).toBeInstanceOf(FormData);
        expect(options.headers).toEqual({'X-CSRF-TOKEN': 'fresh-token'});
    });
    it('surfaces unauthenticated and forbidden responses', async () => {
        for (const status of [401, 403]) {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(csrf()).mockResolvedValueOnce(Response.json({message: 'Denied'}, {status})));
            await expect(uploadAvatar(file())).rejects.toThrow('Denied');
        }
    });
    it('validates weak, same, mismatched and multibyte passwords before sending', async () => {
        const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
        for (const data of [
            {currentPassword: '', newPassword: 'new-password-456', confirmPassword: 'new-password-456'},
            {currentPassword: 'old-password-123', newPassword: 'short', confirmPassword: 'short'},
            {currentPassword: 'old-password-123', newPassword: 'old-password-123', confirmPassword: 'old-password-123'},
            {currentPassword: 'old-password-123', newPassword: 'new-password-456', confirmPassword: 'mismatch'},
            {currentPassword: 'old-password-123', newPassword: 'ệ'.repeat(25), confirmPassword: 'ệ'.repeat(25)},
        ]) { expect(validatePasswordChange(data)).toBeTruthy(); await expect(changePassword(data)).rejects.toThrow(); }
        expect(fetcher).not.toHaveBeenCalled();
    });
    it('posts password fields only to the authenticated self endpoint', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(csrf()).mockResolvedValueOnce(Response.json({code: 200, message: 'Changed', data: null}));
        vi.stubGlobal('fetch', fetcher);
        const data = {currentPassword: 'old-password-123', newPassword: 'new-password-456', confirmPassword: 'new-password-456'};
        await changePassword(data);
        expect(fetcher.mock.calls[1][0]).toBe('/api/auth/me/password');
        expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual(data);
    });
    it('updates the existing profile fields and surfaces invalid input', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(csrf()).mockResolvedValueOnce(Response.json({message: 'Invalid profile'}, {status: 400}));
        vi.stubGlobal('fetch', fetcher);
        await expect(updateProfile({fullName: '', phone: 'bad'})).rejects.toThrow('Invalid profile');
        expect(fetcher.mock.calls[1][0]).toBe('/api/auth/me');
    });
});
