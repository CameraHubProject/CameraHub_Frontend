import {errorMessage} from '../lib/apiResponse';
import {useState} from 'react';
import {Link, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {currentAccount, logout} from '../lib/identity';
import {fetchListings, fetchOrders} from '../lib/marketplace';
import {AddressBook} from './SellerPages';
import {MyListings} from './MyListings';
import {AccountSecurityEditor} from './AccountSecurityEditor';
import {ProfileEditor} from './ProfileEditor';
import {Icon} from './ui';
import './profile.css';

export function ProfileContent() {
    const [params, setParams] = useSearchParams();
    const requestedTab = params.get('tab');
    const tab = requestedTab === 'listings' || requestedTab === 'addresses' || requestedTab === 'settings' ? requestedTab : 'profile';
    const session = useQuery({queryKey: ['session'], queryFn: currentAccount, staleTime: 15_000});
    const listings = useQuery({
        queryKey: ['listings', session.data?.id],
        queryFn: fetchListings,
        enabled: !!session.data
    });
    const orders = useQuery({queryKey: ['orders', session.data?.id], queryFn: fetchOrders, enabled: !!session.data});
    const client = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const state = location.state as { notice?: unknown } | null;
    const notice = typeof state?.notice === 'string' ? state.notice : '';
    const user = session.data;

    async function leave() {
        setBusy(true);
        setError('');
        try {
            await logout();
            client.clear();
            navigate('/dang-nhap');
        } catch (exception) {
            setError(errorMessage(exception));
        } finally {
            setBusy(false);
        }
    }

    if (!user) return null;
    const initials = user.fullName.split(' ').filter(Boolean).map(word => word[0]).slice(-2).join('').toLocaleUpperCase('vi-VN');
    const count = (status: string) => listings.isSuccess ? listings.data.filter(item => item.listingStatus === status).length : '—';
    const pendingCount = listings.isSuccess ? listings.data.filter(item => ['AI_REVIEW', 'PENDING_REVIEW'].includes(item.listingStatus ?? '')).length : '—';
    const metricError = listings.isError || orders.isError;

    return <div className="profile-workspace">
        <aside className="account-sidebar">
            <div className="account-sidebar-identity"><span className="account-mini-avatar">{user.avatarUrl ? <img src={user.avatarUrl} width={40} height={40} alt="Ảnh đại diện"/> : initials}</span>
                <div><strong>{user.fullName}</strong><span>Thành viên CameraHub</span></div>
            </div>
            <p className="account-menu-caption">KHÔNG GIAN CỦA BẠN</p>
            <nav className="account-menu"
                 aria-label="Quản lý tài khoản">{[['profile', 'space_dashboard', 'Tổng quan tài khoản'], ['settings', 'manage_accounts', 'Chỉnh sửa thông tin'], ['listings', 'photo_camera', 'Thiết bị của tôi'], ['addresses', 'location_on', 'Địa chỉ giao nhận']].map(([value, icon, label]) =>
                <button key={value} type="button" className={tab === value ? 'active' : ''}
                        aria-current={tab === value ? 'page' : undefined}
                        onClick={() => setParams(value === 'profile' ? {} : {tab: value})}><Icon
                    name={icon}/><span>{label}</span><Icon name="chevron_right"/></button>)}<Link
                to={`/thanh-vien/${user.id}`}><Icon name="public"/><span>Trang cá nhân công khai</span><Icon
                name="chevron_right"/></Link><Link to="/don-hang"><Icon
                name="receipt_long"/><span>Đơn hàng & giao dịch</span><Icon name="chevron_right"/></Link></nav>
            {user.roles.includes('ADMIN') && <><p className="account-menu-caption">QUẢN TRỊ</p>
                <nav className="account-menu" aria-label="Quản trị"><Link to="/quan-tri/tin-dang"><Icon
                    name="fact_check"/><span>Duyệt tin đăng</span></Link><Link to="/quan-tri/hang-may"><Icon
                    name="category"/><span>Quản lý hãng máy</span></Link></nav>
            </>}
            <div className="account-sidebar-footer"><Icon name="shield"/><p>Thông tin liên hệ được giữ riêng tư. Tin
                đăng và đánh giá nằm trong trang cá nhân công khai.</p></div>
            <button className="account-logout" type="button" disabled={busy} onClick={() => void leave()}><Icon
                name="logout"/>{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
        </aside>
        <div className="profile-main">
            {notice && <div className="profile-notice" role="status"><Icon name="check_circle"/><span>{notice}</span>
                <button type="button" aria-label="Đóng thông báo"
                        onClick={() => navigate({pathname: location.pathname, search: location.search}, {
                            replace: true,
                            state: null
                        })}><Icon name="close"/></button>
            </div>}
            {error && <p className="account-error" role="alert">{error}</p>}
            {tab === 'profile' ? <>
                <section className="profile-welcome">
                    <div><span className="section-kicker">TÀI KHOẢN CAMERAHUB</span><h2>Chào {user.fullName}<span
                        className="welcome-dot">.</span></h2><p>Mỗi chiếc máy là một câu chuyện. Quản lý hành trình của
                        bạn tại đây.</p></div>
                    <Link className="button button-primary" to="/dang-ban"><Icon name="add"/>Đăng bán thiết
                        bị</Link><span className="welcome-camera" aria-hidden="true"><Icon name="photo_camera"/></span>
                </section>
                <div className="account-metrics" aria-label="Hoạt động của tài khoản">
                    <button type="button" className="account-metric" onClick={() => setParams({tab: 'listings'})}><span
                        className="metric-icon"><Icon name="photo_camera"/></span><span><small>Thiết bị đang bán</small><strong>{count('PUBLISHED')}</strong><span>Xem kho thiết bị<Icon
                        name="arrow_forward"/></span></span></button>
                    <button type="button" className="account-metric metric-review"
                            onClick={() => setParams({tab: 'listings'})}><span className="metric-icon"><Icon
                        name="hourglass_top"/></span><span><small>Tin đăng chờ duyệt</small><strong>{pendingCount}</strong><span>Theo dõi trạng thái<Icon
                        name="arrow_forward"/></span></span></button>
                    <Link className="account-metric metric-orders" to="/don-hang"><span className="metric-icon"><Icon
                        name="shopping_bag"/></span><span><small>Đơn hàng & giao dịch</small><strong>{orders.isSuccess ? orders.data.length : '—'}</strong><span>Quản lý đơn hàng<Icon
                        name="arrow_forward"/></span></span></Link>
                </div>
                {metricError && <p className="profile-metric-error" role="alert">Một số hoạt động chưa tải được. <button
                    onClick={() => {
                        void listings.refetch();
                        void orders.refetch();
                    }}>Tải lại dữ liệu</button></p>}
                <div className="profile-details-grid">
                    <section className="account-information">
                        <div className="account-section-heading"><span className="panel-icon"><Icon
                            name="badge"/></span>
                            <div><h2>Thông tin cá nhân</h2><p>Thông tin liên hệ của tài khoản.</p>
                                <button type="button" className="text-link"
                                        onClick={() => setParams({tab: 'settings'})}>Chỉnh sửa thông tin<Icon
                                    name="edit"/></button>
                            </div>
                        </div>
                        <dl className="account-information-list">
                            <div>
                                <dt><Icon name="person"/>Họ và tên</dt>
                                <dd>{user.fullName}</dd>
                            </div>
                            <div>
                                <dt><Icon name="mail"/>Email</dt>
                                <dd>{user.email}</dd>
                            </div>
                            <div>
                                <dt><Icon name="smartphone"/>Số điện thoại</dt>
                                <dd>{user.phone || 'Chưa cung cấp'}</dd>
                            </div>
                        </dl>
                    </section>
                    <section className="account-next-step"><span className="next-step-icon"><Icon
                        name="published_with_changes"/></span><span className="section-kicker">TIẾP NỐI ĐAM MÊ</span>
                        <h2>Cho thiết bị một hành trình mới.</h2><p>Chọn hãng, thêm ảnh thực tế và chia sẻ câu chuyện
                            của chiếc máy. Bạn có thể đăng tin ngay sau khi đăng nhập, AI sẽ kiểm tra nội dung và ảnh
                            trước khi đăng bán.</p><Link className="button button-secondary" to="/dang-ban">Tạo tin đăng
                            mới<Icon name="arrow_forward"/></Link><Link className="next-step-address"
                                                                        to="/tai-khoan?tab=addresses"><Icon
                            name="location_on"/>Quản lý địa chỉ nhận hàng</Link></section>
                </div>
                <MyListings compact/>
            </> : tab === 'settings' ? <section className="account-information">
                <div className="account-section-heading"><span className="panel-icon"><Icon
                    name="manage_accounts"/></span>
                    <div><h2>Chỉnh sửa thông tin cá nhân</h2><p>Cập nhật tên và số điện thoại của bạn.</p></div>
                </div>
                <ProfileEditor key={user.id} user={user}/><AccountSecurityEditor user={user}/></section> : tab === 'listings' ? <MyListings/> :
                <section className="account-addresses">
                    <div className="listing-manager-title">
                        <div><span className="section-kicker">NHẬN THIẾT BỊ THUẬN TIỆN HƠN</span><h2>Địa chỉ giao
                            nhận</h2><p>Lưu địa chỉ để sử dụng nhanh khi thanh toán.</p></div>
                    </div>
                    <AddressBook/></section>}
        </div>
    </div>;
}
