import {useEffect, useRef, useState} from 'react';
import {Link, NavLink, useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {currentAccount} from '../lib/identity';
import {Icon} from './ui';
import {useCart} from '../lib/cart';

export function SiteHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [query, setQuery] = useState('');
    const menuButton = useRef<HTMLButtonElement>(null);
    const navigate = useNavigate();
    const cart = useCart();
    const session = useQuery({queryKey: ['session'], queryFn: currentAccount, retry: false, staleTime: 15_000});
    const accountName = session.data?.fullName.trim() || 'Bạn';
    const initials = accountName.split(/\s+/).slice(-2).map(part => Array.from(part)[0]).join('').toLocaleUpperCase('vi-VN');
    useEffect(() => {
        if (!menuOpen) return;
        const close = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
                menuButton.current?.focus();
            }
        };
        document.addEventListener('keydown', close);
        return () => document.removeEventListener('keydown', close);
    }, [menuOpen]);
    return <>
        <div className="prototype-trustbar"><span><Icon name="verified_user"/>Kiểm định tùy chọn</span><span><Icon
            name="payments"/>Phí sàn 0đ trong MVP</span><span><Icon name="schedule"/>48 giờ bảo vệ · Giao dịch mô phỏng</span>
        </div>
        <header className="prototype-header">
            <div className="container prototype-header-inner">
                <Link className="brand" to="/" aria-label="CameraHub — Trang chủ">CameraHub<span className="brand-dot"/></Link>
                <nav id="site-navigation" className={`prototype-nav ${menuOpen ? 'is-open' : ''}`}
                     aria-label="Điều hướng chính" onClick={event => {
                    if (event.target instanceof Element && event.target.closest('a')) setMenuOpen(false);
                }}>
                    <form className="mobile-menu-search" role="search" onSubmit={event => {
                        event.preventDefault();
                        setMenuOpen(false);
                        navigate(`/may-anh${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
                    }}><label><span className="sr-only">Tìm thiết bị trong menu</span><input
                        placeholder="Tìm tên máy, hãng máy…" value={query}
                        onChange={event => setQuery(event.target.value)}/></label>
                        <button type="submit" aria-label="Tìm thiết bị"><Icon name="search"/></button>
                    </form>
                    <NavLink to="/" end>Trang chủ</NavLink><NavLink to="/may-anh">Máy ảnh</NavLink>
                    <NavLink to="/dang-ban"><Icon name="sell"/>Đăng bán máy ảnh</NavLink><NavLink to="/thu-mua-may-cu">Thu
                    mua máy cũ</NavLink><Link to="/#bao-ve">Về CameraHub</Link>
                </nav>
                <form className="prototype-header-search" role="search" onSubmit={event => {
                    event.preventDefault();
                    navigate(`/may-anh${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
                }}>
                    <Icon name="search"/><input aria-label="Tìm kiếm nhanh" placeholder="Tìm Sony, Fujifilm, Canon…"
                                                value={query} onChange={event => setQuery(event.target.value)}/>
                </form>
                <div className="prototype-header-actions">
                    <Link className="cart-nav" to="/gio-hang" aria-label={`Giỏ hàng, ${cart.length} thiết bị`}><Icon
                        name="shopping_bag"/>{cart.length > 0 && <span>{cart.length}</span>}</Link>
                    {session.data?.roles.includes('ADMIN') &&
                        <Link className="role-chip" to="/quan-tri/tin-dang"><span className="tiny-dot"/>Quản trị</Link>}
                    <Link className={`prototype-account${session.data ? ' is-signed-in' : ''}`}
                          to={session.data ? '/tai-khoan' : '/dang-nhap'}
                          aria-label={session.data ? `Mở tài khoản của ${accountName}` : 'Đăng nhập CameraHub'}
                          title={session.data ? accountName : 'Đăng nhập CameraHub'}>
                        <span className="header-account-avatar" aria-hidden="true">{session.data ? initials :
                            <Icon name="person"/>}{session.data && <span className="header-account-dot"/>}</span>
                        <span className="header-account-copy"><small>{session.data ? 'Xin chào,' : 'Chào bạn!'} <span
                            aria-hidden="true">✦</span></small><strong>{session.data ? accountName : 'Đăng nhập'}</strong></span>
                        <Icon name="chevron_right"/>
                    </Link>
                    <button ref={menuButton} className="icon-button prototype-menu-toggle"
                            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-controls="site-navigation"
                            aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon
                        name={menuOpen ? 'close' : 'menu'}/></button>
                </div>
            </div>
        </header>
    </>;
}

export function SiteFooter() {
    return <footer className="prototype-footer">
        <div className="container">
            <div className="prototype-footer-grid">
                <div><Link className="brand" to="/">CameraHub<span className="brand-dot"/></Link><p>Chọn máy ảnh
                    đúng.<br/>Mua máy an tâm.</p><span
                    className="eyebrow">THÊM MỘT HÀNH TRÌNH CHO THIẾT BỊ CỦA BẠN</span></div>
                <div><h3>Khám phá thiết bị</h3><Link to="/may-anh">Tất cả thiết bị</Link><Link to="/may-anh?type=BODY">Thân
                    máy ảnh</Link><Link to="/may-anh?type=LENS">Ống kính</Link><Link to="/may-anh?type=OTHER">Phụ
                    kiện</Link></div>
                <div><h3>Đồng hành cùng bạn</h3><Link to="/dang-ban">Trở thành người bán</Link><Link to="/#kiem-dinh">Tìm
                    hiểu kiểm định</Link><Link to="/#bao-ve">Bảo vệ giao dịch</Link><Link to="/dang-nhap">Tài khoản
                    CameraHub</Link></div>
                <div><h3>Giao dịch minh bạch</h3><p>Đọc kỹ tình trạng thiết bị và báo cáo kiểm định trước khi quyết
                    định.</p><span className="simulation-label"><span className="tiny-dot"/>Môi trường mô phỏng</span>
                </div>
            </div>
            <div className="prototype-footer-bottom"><span>© {new Date().getFullYear()} CameraHub Vietnam.</span><span>Thanh toán, phí và hoàn tiền đều được mô phỏng.</span>
            </div>
        </div>
    </footer>;
}
