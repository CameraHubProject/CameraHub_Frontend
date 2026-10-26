import {errorMessage} from '../lib/apiResponse';
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {currentAccount} from '../lib/identity';
import {request} from '../lib/marketplace';
import type {Product} from '../lib/products';
import {formatVnd} from '../lib/products';
import {MarketplaceLayout, SessionGate} from './MarketplaceLayout';
import {ProfileContent} from './ProfileContent';
import {Button, EmptyState} from './ui';

export function ProfilePage() {
    return <MarketplaceLayout eyebrow="Trung tâm tài khoản" title="Tài khoản của bạn"
                              description="Quản lý thông tin cá nhân, kho thiết bị và các giao dịch của bạn."><SessionGate><ProfileContent/></SessionGate></MarketplaceLayout>;
}

export function ListingReviewPage() {
    return <MarketplaceLayout eyebrow="Quản trị CameraHub" title="Tin cần Admin hỗ trợ duyệt"
                              description="AI tự duyệt tin đăng. Chỉ các tin AI chưa thể quyết định mới xuất hiện tại đây."><SessionGate><ListingReviews/></SessionGate></MarketplaceLayout>;
}

function ListingReviews() {
    const session = useQuery({queryKey: ['session'], queryFn: currentAccount});
    const allowed = session.data?.roles.includes('ADMIN') ?? false;
    const reviews = useQuery({
        queryKey: ['listing-reviews', session.data?.id],
        queryFn: () => request<Product[]>('/api/admin/listings'),
        enabled: allowed,
        refetchInterval: 5000
    });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState('');

    async function review(event: React.FormEvent<HTMLFormElement>, id: string) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(id);
        setError('');
        try {
            await request(`/api/admin/listings/${id}/review`, {
                approve: data.get('decision') === 'approve',
                note: data.get('note'),
                revision: reviews.data?.find(item => item.id === id)?.moderationRevision
            });
            await reviews.refetch();
        } catch (exception) {
            setError(errorMessage(exception));
        } finally {
            setBusy('');
        }
    }

    if (!allowed) return <p>Bạn chưa có quyền quản trị.</p>;
    return <>{reviews.isPending && <p>Đang tải tin đăng…</p>}{reviews.isError &&
        <p role="alert" className="account-error">Chưa tải được tin. <button onClick={() => void reviews.refetch()}>Thử
            lại</button></p>}{reviews.isSuccess && !reviews.data.length &&
        <EmptyState icon="task_alt" title="Đã xử lý hết tin đăng"
                    description="Các tin AI chưa thể quyết định sẽ xuất hiện tại đây."/>}{reviews.data?.map(item =>
        <article className="surface-card" key={item.id}><h2>{item.title}</h2>
            <p>{item.brand} {item.modelName} · {formatVnd(item.priceVnd)}</p>{item.moderationNote &&
                <p role="status"><strong>Lý do chuyển Admin:</strong> {item.moderationNote}</p>}
            <p>{item.description}</p><p>{item.conditionNotes}</p>
            <div className="review-photos">{item.images?.map(url => <img key={url} src={url}
                                                                         alt="Ảnh thiết bị do người bán tải lên"/>)}</div>
            <form className="account-form" onSubmit={event => void review(event, item.id)}><label>Quyết định<select
                name="decision">
                <option value="approve">Duyệt đăng bán</option>
                <option value="revise">Yêu cầu bổ sung</option>
            </select></label><label>Ghi chú<textarea name="note" required maxLength={2000} rows={2}/></label><Button
                disabled={!!busy}>{busy === item.id ? 'Đang lưu…' : 'Lưu quyết định'}</Button></form>
        </article>)}{error && <p role="alert" className="account-error">{error}</p>}</>;
}

