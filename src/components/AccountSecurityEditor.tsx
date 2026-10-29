import {useState} from 'react';
import type {FormEvent} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {changePassword, uploadAvatar} from '../lib/identity';
import type {Account} from '../lib/identity';
import {errorMessage} from '../lib/apiResponse';
import {Button, Input} from './ui';

export function AccountSecurityEditor({user}: {user: Account}) {
    const client = useQueryClient();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    async function avatar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        const form = event.currentTarget;
        const file = new FormData(form).get('file');
        if (!(file instanceof File)) return;
        setBusy(true); setError(''); setNotice('');
        try {
            const result = await uploadAvatar(file);
            client.setQueryData(['session'], result.data);
            setNotice(result.message); form.reset();
        } catch (exception) { setError(errorMessage(exception)); }
        finally { setBusy(false); }
    }
    async function password(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        setBusy(true); setError(''); setNotice('');
        try {
            const result = await changePassword({currentPassword: String(data.get('currentPassword')), newPassword: String(data.get('newPassword')), confirmPassword: String(data.get('confirmPassword'))});
            form.reset(); setNotice(result.message);
        } catch (exception) { setError(errorMessage(exception)); }
        finally { setBusy(false); }
    }
    return <>
        <form className="account-form profile-edit-form" onSubmit={avatar} aria-busy={busy}>
            <h2>Ảnh đại diện</h2>
            {user.avatarUrl && <img src={user.avatarUrl} width={80} height={80} alt="Ảnh đại diện"/>}
            <Input label="Ảnh JPG, PNG hoặc WebP (tối đa 2 MB)" name="file" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" required disabled={busy}/>
            <Button disabled={busy}>Đổi ảnh đại diện</Button>
        </form>
        <form className="account-form profile-edit-form" onSubmit={password} aria-busy={busy}>
            <h2>Đổi mật khẩu</h2>
            <Input label="Mật khẩu hiện tại" name="currentPassword" type="password" autoComplete="current-password" required maxLength={72} disabled={busy}/>
            <Input label="Mật khẩu mới" name="newPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={72} disabled={busy}/>
            <Input label="Xác nhận mật khẩu mới" name="confirmPassword" type="password" autoComplete="new-password" required maxLength={72} disabled={busy}/>
            <Button disabled={busy}>Đổi mật khẩu</Button>
        </form>
        {error && <p className="account-error" role="alert">{error}</p>}
        {notice && <p className="account-notice" role="status">{notice}</p>}
    </>;
}
