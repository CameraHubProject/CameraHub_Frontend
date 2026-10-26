import {errorMessage} from '../lib/apiResponse';
import {useState} from 'react';
import type {FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {submitSellerReview} from '../lib/marketplace';
import type {SellerOrderReview as Review} from '../lib/marketplace';
import {Button, Icon} from './ui';
import {RatingStars} from './PublicProfilePage';

export function SellerOrderReview({orderId, sellerId, review, canReview}: {
    orderId: string;
    sellerId: string;
    review?: Review | null;
    canReview?: boolean
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [rating, setRating] = useState('5');
    const [comment, setComment] = useState('');
    const client = useQueryClient();

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setBusy(true);
        try {
            await submitSellerReview(orderId, Number(rating), comment.trim());
            await Promise.all([client.invalidateQueries({queryKey: ['order', orderId]}), client.invalidateQueries({queryKey: ['seller-profile', sellerId]}), client.invalidateQueries({queryKey: ['seller-reviews', sellerId]})]);
        } catch (exception) {
            setError(errorMessage(exception));
        } finally {
            setBusy(false);
        }
    }

    return <section className="surface-card seller-order-review">
        <div className="card-title-row"><h2>Đánh giá người bán</h2><Link className="text-link"
                                                                         to={`/thanh-vien/${sellerId}`}>Trang cá
            nhân<Icon name="arrow_outward"/></Link></div>
        {review ? <><RatingStars rating={review.rating}/><p className="preserve-lines">{review.comment}</p><small>Đã
            gửi {new Date(review.createdAt).toLocaleDateString('vi-VN')}</small></> : canReview ?
            <form noValidate className="account-form" onSubmit={submit}><p>Chia sẻ trải nghiệm của bạn để người mua sau có thêm
                thông tin.</p><label>Số sao<select value={rating} onChange={event => setRating(event.target.value)}
                                                   disabled={busy}>{[5, 4, 3, 2, 1].map(value => <option key={value}
                                                                                                         value={value}>{value} sao</option>)}</select></label><label>Nhận
                xét<textarea value={comment} onChange={event => setComment(event.target.value)} required
                             maxLength={2000} rows={4} disabled={busy}
                             placeholder="Thiết bị có đúng mô tả? Trải nghiệm giao dịch của bạn thế nào?"/></label><small>{comment.length}/2000
                ký tự · Nhận xét và tên của bạn sẽ hiển thị công khai.</small>{error &&
                <p role="alert" className="account-error">{error}</p>}<Button loading={busy}>Gửi đánh giá<Icon
                name="star"/></Button></form> : <p>Người mua có thể đánh giá một lần sau khi đơn hàng hoàn tất.</p>}
    </section>;
}
