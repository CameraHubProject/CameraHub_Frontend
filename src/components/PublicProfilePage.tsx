import {deviceTypeLabels} from '../lib/deviceTypes';
import {useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {currentAccount} from '../lib/identity';
import {fetchSellerListings, fetchSellerProfile, fetchSellerReviews} from '../lib/marketplace';
import {formatVnd} from '../lib/products';
import {MarketplaceLayout} from './MarketplaceLayout';
import {Button, EmptyState, Icon, ProductMedia, Skeleton} from './ui';
import './public-profile.css';

export function RatingStars({rating}: { rating: number }) {
    return <span className="rating-stars" role="img"
                 aria-label={`${rating.toLocaleString('vi-VN')} trên 5 sao`}>{[1, 2, 3, 4, 5].map(star => <span
        key={star} className={star <= Math.round(rating) ? 'filled' : ''}><Icon name="star"/></span>)}</span>;
}

export function PublicProfilePage() {
    const {id = ''} = useParams();
    const [params, setParams] = useSearchParams();
    const tab = params.get('tab') === 'sold' ? 'sold' : params.get('tab') === 'reviews' ? 'reviews' : 'selling';
    const rawPage = Number(params.get('page') ?? 0);
    const page = Number.isInteger(rawPage) && rawPage >= 0 && rawPage <= 100000 ? rawPage : 0;
    const profile = useQuery({queryKey: ['seller-profile', id], queryFn: () => fetchSellerProfile(id), retry: false});
    const session = useQuery({queryKey: ['session'], queryFn: currentAccount, retry: false, staleTime: 15_000});
    const listings = useQuery({
        queryKey: ['seller-listings', id, tab, page],
        queryFn: () => fetchSellerListings(id, tab === 'sold' ? 'SOLD' : 'PUBLISHED', page),
        enabled: profile.isSuccess && tab !== 'reviews'
    });
    const reviews = useQuery({
        queryKey: ['seller-reviews', id, page],
        queryFn: () => fetchSellerReviews(id, page),
        enabled: profile.isSuccess && tab === 'reviews'
    });
    const [copyMessage, setCopyMessage] = useState('');
    const user = profile.data;
    const active = tab === 'reviews' ? reviews : listings;

    function changeTab(value: string) {
        setParams(value === 'selling' ? {} : {tab: value});
    }

    function changePage(value: number) {
        setParams({...(tab === 'selling' ? {} : {tab}), ...(value ? {page: String(value)} : {})});
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/thanh-vien/${id}`);
            setCopyMessage('Đã sao chép liên kết trang cá nhân.');
        } catch {
            setCopyMessage('Bạn có thể sao chép đường dẫn trên thanh địa chỉ.');
        }
    }

    return <MarketplaceLayout eyebrow="Thành viên CameraHub" title={user?.fullName ?? 'Trang cá nhân'}>
        {profile.isPending && <Skeleton/>}
        {profile.isError && <EmptyState icon="person_search" title="Chưa mở được trang cá nhân"
                                        description="Trang cá nhân không tồn tại, không còn công khai hoặc kết nối đang gặp sự cố."
                                        action={<Button variant="secondary" onClick={() => void profile.refetch()}>Thử
                                            lại</Button>}/>}
        {user && <div className="public-profile">
            <section className="public-profile-hero surface-card" aria-label="Thông tin thành viên">
                <div className="public-profile-cover"><Icon
                    name="photo_camera"/><span>MỖI THIẾT BỊ. MỘT HÀNH TRÌNH MỚI.</span></div>
                <div className="public-profile-identity"><span className="public-profile-avatar"
                                                               aria-hidden="true">{user.fullName.split(' ').filter(Boolean).map(word => word[0]).slice(-2).join('').toLocaleUpperCase('vi-VN')}</span>
                    <div className="public-profile-name"><span
                        className="section-kicker">GÓC THIẾT BỊ CỦA THÀNH VIÊN</span><h2>{user.fullName}</h2><p><Icon
                        name="calendar_month"/>Tham
                        gia {new Date(user.joinedAt).toLocaleDateString('vi-VN', {month: 'long', year: 'numeric'})}</p>
                    </div>
                    <div className="public-profile-actions"><Button variant="secondary" onClick={() => void copyLink()}><Icon
                        name="share"/>Chia sẻ trang cá nhân</Button>{session.data?.id === id &&
                        <Link className="text-link" to="/tai-khoan">Quản lý tài khoản<Icon
                            name="arrow_forward"/></Link>}</div>
                </div>
                {copyMessage && <p className="public-profile-copy" role="status">{copyMessage}</p>}
                <div className="public-profile-metrics">
                    <div><Icon name="photo_camera"/><strong>{user.sellingCount}</strong><span>Thiết bị đang bán</span>
                    </div>
                    <div><Icon name="handshake"/><strong>{user.soldCount}</strong><span>Thiết bị đã bán</span></div>
                    <div><Icon
                        name="star"/><strong>{user.averageRating == null ? '—' : `${user.averageRating.toLocaleString('vi-VN')}/5`}</strong><span>{user.reviewCount ? `${user.reviewCount} đánh giá từ người mua` : 'Chưa có đánh giá'}</span>
                    </div>
                </div>
            </section>
            <nav className="public-profile-tabs"
                 aria-label="Nội dung trang cá nhân">{[['selling', 'Đang bán', user.sellingCount], ['sold', 'Đã bán', user.soldCount], ['reviews', 'Đánh giá', user.reviewCount]].map(([value, label, count]) =>
                <button key={value} type="button" className={tab === value ? 'active' : ''}
                        aria-current={tab === value ? 'page' : undefined}
                        onClick={() => changeTab(String(value))}>{label}<span>{count}</span></button>)}</nav>
            <section className="public-profile-content"
                     aria-label={tab === 'selling' ? 'Thiết bị đang bán' : tab === 'sold' ? 'Thiết bị đã bán' : 'Đánh giá người bán'}
                     aria-busy={active.isPending}>
                <div className="public-profile-section-title">
                    <div>
                        <h2>{tab === 'selling' ? 'Đang chờ một người đồng hành mới' : tab === 'sold' ? 'Những thiết bị đã trao tay' : 'Trải nghiệm từ người mua'}</h2>
                        <p>{tab === 'reviews' ? 'Mỗi đánh giá gắn với một đơn hàng đã hoàn tất trên CameraHub.' : tab === 'sold' ? 'Lịch sử thiết bị được ghi nhận đã bán của thành viên.' : 'Các tin đăng đang công khai của thành viên.'}</p>
                    </div>
                    {tab === 'reviews' && user.averageRating != null && <div className="public-profile-rating">
                        <strong>{user.averageRating.toLocaleString('vi-VN')}</strong><RatingStars
                        rating={user.averageRating}/><span>{user.reviewCount} đánh giá</span></div>}</div>
                {active.isPending && <div className="public-profile-grid"><Skeleton/><Skeleton/><Skeleton/></div>}
                {active.isError && <EmptyState icon="wifi_off" title="Chưa tải được nội dung"
                                               description="Hãy kiểm tra kết nối rồi thử lại."
                                               action={<Button variant="secondary"
                                                               onClick={() => void active.refetch()}>Thử
                                                   lại</Button>}/>}
                {active.isSuccess && active.data.total === 0 &&
                    <EmptyState icon={tab === 'reviews' ? 'reviews' : 'photo_camera'}
                                title={tab === 'selling' ? 'Chưa có thiết bị đang bán' : tab === 'sold' ? 'Chưa có thiết bị đã bán' : 'Chưa có đánh giá'}
                                description={tab === 'reviews' ? 'Đánh giá từ người mua sẽ xuất hiện sau khi giao dịch hoàn tất.' : 'Các thiết bị của thành viên sẽ xuất hiện tại đây khi có trạng thái phù hợp.'}/>}
                {tab !== 'reviews' && listings.data &&
                    <div className="public-profile-grid">{listings.data.items.map(product => <article
                        className="public-listing-card surface-card" key={product.id}><Link
                        className="public-listing-image" to={`/may-anh/${product.id}`}><ProductMedia product={product}/><span
                        className={`public-listing-status ${product.listingStatus === 'SOLD' ? 'is-sold' : ''}`}>{product.listingStatus === 'SOLD' ? 'Đã bán' : 'Đang bán'}</span></Link>
                        <div className="public-listing-info"><span
                            className="eyebrow">{product.brand} · {deviceTypeLabels[product.deviceType]}</span>
                            <h3><Link to={`/may-anh/${product.id}`}>{product.title}</Link></h3>
                            <p>{product.conditionNotes}</p>
                            <div><strong>{formatVnd(product.priceVnd)}</strong><Link to={`/may-anh/${product.id}`}
                                                                                     aria-label={`Xem ${product.title}`}><Icon
                                name="arrow_outward"/></Link></div>
                        </div>
                    </article>)}</div>}
                {tab === 'reviews' && reviews.data &&
                    <div className="public-review-list">{reviews.data.items.map(review => <article
                        className="surface-card public-review" key={review.id}>
                        <header><span className="public-review-avatar"><Icon name="person"/></span>
                            <div>{review.authorId ?
                                <Link to={`/thanh-vien/${review.authorId}`}>{review.authorName}</Link> :
                                <strong>{review.authorName}</strong>}
                                <time
                                    dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</time>
                            </div>
                            <RatingStars rating={review.rating}/></header>
                        <p className="preserve-lines">{review.comment}</p><Link className="public-review-product"
                                                                                to={`/may-anh/${review.productId}`}><Icon
                        name="photo_camera"/>{review.productTitle || 'Thiết bị đã mua'}<Icon
                        name="arrow_forward"/></Link><small><Icon name="check_circle"/>Đã mua hàng · Đơn hàng đã hoàn
                        tất</small></article>)}</div>}
                {active.isSuccess && active.data.total > 0 && <div className="public-profile-pagination">
                    <span>{active.data.total} {tab === 'reviews' ? 'đánh giá' : 'thiết bị'}</span>
                    <nav aria-label="Phân trang trang cá nhân"><Button variant="secondary" disabled={page === 0}
                                                                       onClick={() => changePage(page - 1)}
                                                                       aria-label="Trang trước"><Icon
                        name="chevron_left"/></Button><span>Trang {page + 1} / {Math.max(1, Math.ceil(active.data.total / active.data.pageSize))}</span><Button
                        variant="secondary" disabled={(page + 1) * active.data.pageSize >= active.data.total}
                        onClick={() => changePage(page + 1)} aria-label="Trang sau"><Icon
                        name="chevron_right"/></Button></nav>
                </div>}
            </section>
        </div>}
    </MarketplaceLayout>;
}
