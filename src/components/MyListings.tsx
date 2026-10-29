import {deviceTypeLabels} from '../lib/deviceTypes';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {currentAccount} from '../lib/identity';
import {fetchListings} from '../lib/marketplace';
import {filterProducts, formatVnd} from '../lib/products';
import type {Product} from '../lib/products';
import {Button, EmptyState, Icon, Modal, ProductMedia} from './ui';

const statusLabels: Record<string, string> = {
    PUBLISHED: 'Đang bán', AI_REVIEW: 'AI đang kiểm tra', PENDING_REVIEW: 'Chờ Admin', NEEDS_REVISION: 'Cần bổ sung',
    DRAFT: 'Bản nháp', RESERVED: 'Đã đặt mua', SOLD: 'Đã bán', REJECTED: 'Bị từ chối', HIDDEN: 'Đã ẩn',
};
const filters = [['ALL', 'Tất cả'], ['PUBLISHED', 'Đang bán'], ['AI_REVIEW', 'AI đang kiểm tra'], ['PENDING_REVIEW', 'Chờ Admin'], ['NEEDS_REVISION', 'Cần bổ sung'], ['RESERVED', 'Đã đặt mua'], ['SOLD', 'Đã bán']];

export function MyListings({compact = false}: { compact?: boolean } = {}) {
    const session = useQuery({queryKey: ['session'], queryFn: currentAccount, staleTime: 15_000});
    const listings = useQuery({
        queryKey: ['listings', session.data?.id],
        queryFn: fetchListings,
        enabled: !!session.data,
        refetchInterval: query => query.state.data?.some(item => item.listingStatus === 'AI_REVIEW') ? 3000 : false
    });
    const [status, setStatus] = useState('ALL');
    const [query, setQuery] = useState('');
    const [active, setActive] = useState<Product | null>(null);
    const [photoIndex, setPhotoIndex] = useState(0);
    const all = listings.data ?? [];
    const matching = filterProducts(all, {query, brand: '', deviceType: '', budget: ''})
        .filter(item => status === 'ALL' || item.listingStatus === status);
    const items = compact ? all.slice(0, 3) : matching;

    function openPhotos(item: Product) {
        setActive(item);
        setPhotoIndex(0);
    }

    return <section className={`listing-manager ${compact ? 'listing-manager-compact' : ''}`}
                    aria-label="Kho thiết bị cá nhân">
        <div className="listing-manager-title">
            <div><span className="section-kicker">GÓC THIẾT BỊ CỦA BẠN</span>
                <h2>{compact ? 'Thiết bị gần đây' : 'Thiết bị của tôi'}</h2>
                <p>{compact ? 'Những tin đăng mới nhất trong kho của bạn.' : 'Theo dõi tin đăng, ảnh thiết bị và trạng thái duyệt.'}</p>
            </div>
            <Link className={`button button-${compact ? 'secondary' : 'primary'}`}
                  to={compact ? '/tai-khoan?tab=listings' : '/dang-ban'}><Icon
                name={compact ? 'arrow_forward' : 'add'}/>{compact ? 'Xem tất cả' : 'Đăng tin mới'}</Link>
        </div>
        {!compact && <div className="listing-manager-controls">
            <nav className="listing-status-tabs" aria-label="Lọc trạng thái tin đăng">{filters.map(([value, label]) =>
                <button type="button" key={value} className={status === value ? 'active' : ''}
                        aria-pressed={status === value}
                        onClick={() => setStatus(value)}>{label}<span>{listings.isSuccess ? value === 'ALL' ? all.length : all.filter(item => item.listingStatus === value).length : '—'}</span>
                </button>)}</nav>
            <label className="listing-search"><Icon name="search"/><input type="search"
                                                                          aria-label="Tìm trong thiết bị của tôi"
                                                                          placeholder="Tìm theo tên thiết bị, hãng máy…"
                                                                          value={query}
                                                                          onChange={event => setQuery(event.target.value)}/></label>
        </div>}
        <div className="listing-manager-content" aria-live="polite" aria-busy={listings.isPending}>
            {listings.isPending &&
                <div className="inventory-loading" role="status"><Icon name="progress_activity"/>Đang tải kho thiết bị…
                </div>}
            {listings.isError && <EmptyState icon="wifi_off" title="Chưa tải được kho thiết bị"
                                             description="Tin đăng vẫn được lưu. Hãy kiểm tra kết nối rồi thử lại."
                                             action={<Button variant="secondary"
                                                             onClick={() => void listings.refetch()}><Icon
                                                 name="refresh"/>Thử lại</Button>}/>}
            {listings.isSuccess && items.length === 0 && <EmptyState icon={query ? 'search_off' : 'photo_camera'}
                                                                     title={query ? 'Chưa tìm thấy thiết bị' : all.length ? 'Chưa có tin ở trạng thái này' : 'Chiếc máy tiếp theo đang chờ bạn'}
                                                                     description={query ? 'Thử tên máy, hãng hoặc từ khóa khác.' : all.length ? 'Chọn trạng thái khác để xem các thiết bị đã đăng.' : 'Đăng tin đầu tiên để trao thiết bị và tiếp nối đam mê.'}
                                                                     action={all.length ?
                                                                         <Button variant="secondary" onClick={() => {
                                                                             setStatus('ALL');
                                                                             setQuery('');
                                                                         }}>Xóa bộ lọc</Button> :
                                                                         <Link className="button button-primary"
                                                                               to="/dang-ban"><Icon name="add"/>Đăng
                                                                             thiết bị đầu tiên</Link>}/>}
            {items.map(item => <article className="inventory-item" key={item.id}>
                <button type="button" className="inventory-photo" aria-label={`Xem ảnh ${item.title}`}
                        onClick={() => openPhotos(item)}><ProductMedia product={item}/><span
                    className="inventory-photo-count"><Icon
                    name="photo_library"/>{item.images?.length ? `${item.images.length} ảnh` : 'Chưa có ảnh'}</span>
                </button>
                <div className="inventory-description">
                    <div className="inventory-item-top"><span className="inventory-brand">{item.brand}</span><span
                        className={`inventory-status inventory-status-${item.listingStatus?.toLowerCase()}`}>{statusLabels[item.listingStatus ?? ''] ?? item.listingStatus}</span>
                    </div>
                    <h3>{item.listingStatus === 'PUBLISHED' ?
                        <Link to={`/may-anh/${item.id}`}>{item.title}</Link> : item.title}</h3>
                    <p>{item.conditionNotes}</p>{item.moderationNote &&
                    <p className="inventory-review-note"><Icon name="info"/>{item.moderationNote}</p>}
                    <div className="inventory-meta"><span><Icon
                        name={item.deviceType === 'LENS' ? 'camera' : 'photo_camera'}/>{deviceTypeLabels[item.deviceType]}</span>{item.shutterCount !== null &&
                        <span><Icon name="speed"/>{item.shutterCount.toLocaleString('vi-VN')} lần chụp</span>}</div>
                </div>
                <div className="inventory-item-actions"><strong
                    className="inventory-price">{formatVnd(item.priceVnd)}</strong><span
                    className="inventory-price-label">Giá đăng bán</span>{!compact && ["DRAFT", "NEEDS_REVISION", "PUBLISHED"].includes(item.listingStatus ?? "") &&
                    <Link className="button button-primary" to={`/dang-ban?draft=${item.id}`}><Icon name="edit"/>Chỉnh sửa</Link>}
                    <button type="button" className="button button-secondary" onClick={() => openPhotos(item)}><Icon
                        name="photo_library"/>Xem ảnh
                    </button>
                </div>
            </article>)}
        </div>
        <Modal open={!!active} onClose={() => setActive(null)} title={active?.title ?? 'Ảnh thiết bị'}>{active &&
            <div className="inventory-gallery">{active.images?.length ? <>
                <div className="inventory-gallery-main"><ProductMedia product={active} index={photoIndex}/></div>
                <div className="photo-thumbnails" aria-label="Chọn ảnh thiết bị">{active.images.map((url, index) =>
                    <button type="button" key={url} aria-label={`Xem ảnh ${index + 1}`}
                            aria-pressed={index === photoIndex} onClick={() => setPhotoIndex(index)}><ProductMedia
                        product={active} index={index}/></button>)}</div>
                <p className="inventory-photo-help"><Icon name="lock"/>Ảnh tin chờ duyệt chỉ hiển thị với bạn và Admin.
                </p></> : <EmptyState icon="image_not_supported" title="Tin này chưa có ảnh được lưu"
                                      description="Nếu vừa gặp lỗi tải ảnh, hãy quay lại biểu mẫu đang mở để thử lại các ảnh còn thiếu."/>}</div>}</Modal>
    </section>;
}
