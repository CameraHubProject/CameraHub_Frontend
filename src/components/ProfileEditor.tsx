import {ApiError, errorMessage} from '../lib/apiResponse';
import {useState} from 'react';
import type {FormEvent} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import type {Account} from '../lib/identity';
import {updateProfile} from '../lib/identity';
import {Button, Input} from './ui';


export function ProfileEditor({user}: { user: Account }) {
    const client = useQueryClient();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState('');
    const [fields,setFields]=useState<Record<string,string>>({});

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError('');
        setSaved('');setFields({});
        try {
            const result = await updateProfile({
                fullName: String(data.get('fullName')).trim(),
                phone: String(data.get('phone')).trim()
            });
            const account = result.data;
            client.setQueryData(['session'], account);
            await client.invalidateQueries({queryKey: ['seller-profile', account.id]});
            await client.invalidateQueries({queryKey: ['product']});
            await client.invalidateQueries({queryKey: ['featured-products']});
            setSaved(result.message);
        } catch (exception) {
            if(exception instanceof ApiError)setFields(exception.errors);
            setError(errorMessage(exception));
        } finally {
            setBusy(false);
        }
    }

    return <form className="account-form profile-edit-form" noValidate onChange={()=>setFields({})} onSubmit={save} aria-busy={busy}>
        <fieldset disabled={busy} style={{border: 0, padding: 0, margin: 0, minWidth: 0, display: 'grid', gap: 16}}>
            <legend className="sr-only">Chỉnh sửa thông tin cá nhân</legend>
            <Input label="Họ và tên" name="fullName" serverError={fields.fullName} autoComplete="name" required maxLength={160}
                   defaultValue={user.fullName}/>
            <Input label="Số điện thoại" name="phone" serverError={fields.phone} type="tel" autoComplete="tel" required maxLength={20}
                   defaultValue={user.phone ?? ''} placeholder="0912 345 678"/>
            <p className="muted">Số điện thoại mới cũng được dùng để đăng nhập.</p>
            <Input label="Email" type="email" value={user.email} readOnly/>
            <Button loading={busy}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</Button>
        </fieldset>
        {error && <p className="account-error" role="alert">{error}</p>}
        {saved && <p className="account-notice" role="status">{saved}</p>}
    </form>;
}
