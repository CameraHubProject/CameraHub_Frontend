import {useState} from 'react';
import type {FormEvent} from 'react';
import type {Product} from '../lib/products';
import {errorMessage} from '../lib/apiResponse';
import {withdrawListing} from '../lib/listingLifecycle';
import type {ListingAction} from '../lib/listingLifecycle';
import {Button, Icon, Modal} from './ui';

export function ListingActionDialog({listing, action, onClose, onSuccess}: {
    listing: Product; action: ListingAction; onClose: () => void; onSuccess: (message: string) => Promise<void>;
}) {
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const deleting = action === 'delete';
    async function confirm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        setError('');
        setBusy(true);
        try {
            const result = await withdrawListing(listing.id, action, reason);
            await onSuccess(result.message);
        } catch (exception) {
            setError(errorMessage(exception));
        } finally {
            setBusy(false);
        }
    }
    return <Modal open onClose={() => {if (!busy) onClose();}} title={deleting ? 'Xóa tin đăng' : 'Ẩn tin đăng'}>
        <form className="account-form listing-action-form" onSubmit={confirm} aria-busy={busy}>
            <p className="listing-action-title">{listing.title}</p>
            <p>{deleting
                ? 'Tin sẽ bị gỡ khỏi kho thiết bị và bạn không thể tự đăng lại tin này. Lịch sử xử lý vẫn được lưu.'
                : 'Tin sẽ ngừng hiển thị với người mua. Bạn có thể chỉnh sửa và gửi duyệt để đăng lại.'}</p>
            <label>Lý do {deleting ? 'xóa' : 'ẩn'} tin <span aria-hidden="true">*</span>
                <textarea name="reason" value={reason} onChange={event => setReason(event.target.value)}
                          required maxLength={2000} rows={4} disabled={busy}
                          placeholder="Ví dụ: Tạm ngừng bán, đăng nhầm thông tin…"/>
            </label>
            <small>{reason.length}/2000 ký tự · Bắt buộc nhập lý do</small>
            {error && <p className="account-error" role="alert">{error}</p>}
            <div className="listing-action-buttons">
                <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Hủy</Button>
                <Button className={deleting ? 'listing-delete-confirm' : ''} loading={busy} disabled={!reason.trim()}>
                    <Icon name={deleting ? 'delete' : 'visibility_off'}/>Xác nhận {deleting ? 'xóa' : 'ẩn'} tin
                </Button>
            </div>
        </form>
    </Modal>;
}
