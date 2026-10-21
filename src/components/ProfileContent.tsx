import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { currentAccount, logout } from '../lib/identity';
import { fetchListings, fetchOrders } from '../lib/marketplace';
import { AddressBook } from './SellerPages';
import { MyListings } from './MyListings';
import { Icon } from './ui';
import './profile.css';

export function ProfileContent() {
  const [params, setParams] = useSearchParams(); const requestedTab = params.get('tab');
  const tab = requestedTab === 'listings' || requestedTab === 'addresses' ? requestedTab : 'profile';
  const session = useQuery({ queryKey: ['session'], queryFn: currentAccount, staleTime: 15_000 });
  const listings = useQuery({ queryKey: ['listings', session.data?.id], queryFn: fetchListings, enabled: !!session.data });
  const orders = useQuery({ queryKey: ['orders', session.data?.id], queryFn: fetchOrders, enabled: !!session.data });
  const client = useQueryClient(); const navigate = useNavigate(); const location = useLocation();
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const state = location.state as { notice?: unknown } | null;
  const notice = typeof state?.notice === 'string' ? state.notice : '';
  const user = session.data;
  async function leave() {
    setBusy(true); setError('');
    try { await logout(); client.clear(); navigate('/dang-nhap'); }
    catch (exception) { setError(exception instanceof Error ? exception.message : 'Chưa đăng xuất được. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }
  if (!user) return null;
  const seller = user.roles.includes('SELLER');
  const initials = user.fullName.split(' ').filter(Boolean).map(word => word[0]).slice(-2).join('').toLocaleUpperCase('vi-VN');
  const count = (status: string) => listings.isSuccess ? listings.data.filter(item => item.listingStatus === status).length : '—';
  const metricError = listings.isError || orders.isError;

  return <div className="profile-workspace">
    <aside className="account-sidebar"><div className="account-sidebar-identity"><span className="account-mini-avatar">{initials}</span><div><strong>{user.fullName}</strong><span>{seller ? 'Người bán đã xác minh' : 'Thành viên CameraHub'}</span></div></div>
      <p className="account-menu-caption">KHÔNG GIAN CỦA BẠN</p>
      <nav className="account-menu" aria-label="Quản lý tài khoản">{[['profile', 'space_dashboard', 'Tổng quan tài khoản'], ['listings', 'photo_camera', 'Thiết bị của tôi'], ['addresses', 'location_on', 'Địa chỉ giao nhận']].map(([value, icon, label]) => <button key={value} type="button" className={tab === value ? 'active' : ''} aria-current={tab === value ? 'page' : undefined} onClick={() => setParams(value === 'profile' ? {} : { tab: value })}><Icon name={icon} /><span>{label}</span><Icon name="chevron_right" /></button>)}<Link to="/don-hang"><Icon name="receipt_long" /><span>Đơn hàng & giao dịch</span><Icon name="chevron_right" /></Link><Link to="/tai-khoan/xac-minh"><Icon name="verified_user" /><span>Hồ sơ xác minh</span><Icon name="chevron_right" /></Link></nav>
      {user.roles.includes('ADMIN') && <><p className="account-menu-caption">QUẢN TRỊ</p><nav className="account-menu" aria-label="Quản trị"><Link to="/quan-tri/xac-minh"><Icon name="how_to_reg" /><span>Duyệt người bán</span></Link><Link to="/quan-tri/tin-dang"><Icon name="fact_check" /><span>Duyệt tin đăng</span></Link></nav></>}
      <div className="account-sidebar-footer"><Icon name="shield" /><p>Thông tin của bạn được giữ riêng tư và bảo vệ.</p></div>
      <button className="account-logout" type="button" disabled={busy} onClick={() => void leave()}><Icon name="logout" />{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
    </aside>
    <div className="profile-main">
      {notice && <div className="profile-notice" role="status"><Icon name="check_circle" /><span>{notice}</span><button type="button" aria-label="Đóng thông báo" onClick={() => navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null })}><Icon name="close" /></button></div>}
      {error && <p className="account-error" role="alert">{error}</p>}
      {tab === 'profile' ? <>
        <section className="profile-welcome"><div><span className="section-kicker">TÀI KHOẢN CAMERAHUB</span><h2>Chào {user.fullName}<span className="welcome-dot">.</span></h2><p>Mỗi chiếc máy là một câu chuyện. Quản lý hành trình của bạn tại đây.</p></div><Link className="button button-primary" to="/dang-ban"><Icon name="add" />Đăng bán thiết bị</Link><span className="welcome-camera" aria-hidden="true"><Icon name="photo_camera" /></span></section>
        <div className="account-metrics" aria-label="Hoạt động của tài khoản">
          <button type="button" className="account-metric" onClick={() => setParams({ tab: 'listings' })}><span className="metric-icon"><Icon name="photo_camera" /></span><span><small>Thiết bị đang bán</small><strong>{count('PUBLISHED')}</strong><span>Xem kho thiết bị<Icon name="arrow_forward" /></span></span></button>
          <button type="button" className="account-metric metric-review" onClick={() => setParams({ tab: 'listings' })}><span className="metric-icon"><Icon name="hourglass_top" /></span><span><small>Tin đăng chờ duyệt</small><strong>{count('PENDING_REVIEW')}</strong><span>Theo dõi trạng thái<Icon name="arrow_forward" /></span></span></button>
          <Link className="account-metric metric-orders" to="/don-hang"><span className="metric-icon"><Icon name="shopping_bag" /></span><span><small>Đơn hàng & giao dịch</small><strong>{orders.isSuccess ? orders.data.length : '—'}</strong><span>Quản lý đơn hàng<Icon name="arrow_forward" /></span></span></Link>
        </div>
        {metricError && <p className="profile-metric-error" role="alert">Một số hoạt động chưa tải được. <button onClick={() => { void listings.refetch(); void orders.refetch(); }}>Tải lại dữ liệu</button></p>}
        <div className="profile-details-grid"><section className="account-information"><div className="account-section-heading"><span className="panel-icon"><Icon name="badge" /></span><div><h2>Thông tin cá nhân</h2><p>Thông tin liên hệ của tài khoản.</p></div></div><dl className="account-information-list"><div><dt><Icon name="person" />Họ và tên</dt><dd>{user.fullName}</dd></div><div><dt><Icon name="mail" />Email</dt><dd>{user.email}</dd></div><div><dt><Icon name="smartphone" />Số điện thoại</dt><dd>{user.phone || 'Chưa cung cấp'}</dd></div><div><dt><Icon name="verified_user" />Tài khoản người bán</dt><dd><span className={`account-verification ${seller ? 'is-verified' : ''}`}><Icon name={seller ? 'check_circle' : 'info'} />{seller ? 'Đã xác minh' : 'Chưa xác minh'}</span></dd></div></dl></section>
          <section className="account-next-step"><span className="next-step-icon"><Icon name={seller ? 'published_with_changes' : 'verified_user'} /></span><span className="section-kicker">TIẾP NỐI ĐAM MÊ</span><h2>{seller ? 'Cho thiết bị một hành trình mới.' : 'Sẵn sàng trở thành người bán?'}</h2><p>{seller ? 'Chọn hãng, thêm ảnh thực tế và chia sẻ câu chuyện của chiếc máy.' : 'Hoàn tất hồ sơ xác minh để bắt đầu đăng bán thiết bị trên CameraHub.'}</p><Link className="button button-secondary" to={seller ? '/dang-ban' : '/tai-khoan/xac-minh'}>{seller ? 'Tạo tin đăng mới' : 'Hoàn tất hồ sơ'}<Icon name="arrow_forward" /></Link><Link className="next-step-address" to="/tai-khoan?tab=addresses"><Icon name="location_on" />Quản lý địa chỉ nhận hàng</Link></section>
        </div>
        <MyListings compact />
      </> : tab === 'listings' ? <MyListings /> : <section className="account-addresses"><div className="listing-manager-title"><div><span className="section-kicker">NHẬN THIẾT BỊ THUẬN TIỆN HƠN</span><h2>Địa chỉ giao nhận</h2><p>Lưu địa chỉ để sử dụng nhanh khi thanh toán.</p></div></div><AddressBook /></section>}
    </div>
  </div>;
}
