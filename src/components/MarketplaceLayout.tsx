import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {currentAccount} from '../lib/identity';
import {SiteHeader, SiteFooter} from './SiteLayout';
import {Button, Icon} from './ui';

export function MarketplaceLayout({title, eyebrow, description, children, aside}: {
    title: string;
    eyebrow?: string;
    description?: string;
    children: ReactNode;
    aside?: ReactNode
}) {
    return <><a className="skip-link" href="#noi-dung">Chuyển đến nội dung</a><SiteHeader/>
        <main className="container marketplace-page" id="noi-dung">
            <div className="breadcrumb"><Link to="/"><Icon name="home"/>Trang chủ</Link><Icon
                name="chevron_right"/><span>{eyebrow ?? title}</span></div>
            <header className="marketplace-heading">
                <div>{eyebrow && <span className="eyebrow-chip"><Icon name="verified_user"/>{eyebrow}</span>}
                    <h1>{title}</h1>{description && <p>{description}</p>}</div>
                {aside}</header>
            {children}</main>
        <SiteFooter/></>;
}

export function SessionGate({children}: { children: ReactNode }) {
    const session = useQuery({queryKey: ['session'], queryFn: currentAccount, retry: false, staleTime: 15_000});
    if (session.isPending) return <div className="surface-card" role="status">Đang tải tài khoản…</div>;
    if (session.isError) return <div className="surface-card"><h2>Chưa kết nối được máy chủ</h2><Button
        onClick={() => void session.refetch()}>Thử lại</Button></div>;
    if (!session.data) return <div className="surface-card sign-in-prompt"><Icon name="person"/><h2>Đăng nhập để tiếp
        tục</h2><p>Lưu đơn hàng, địa chỉ và thiết bị của bạn tại CameraHub.</p><Link className="button button-primary"
                                                                                     to="/dang-nhap">Đăng nhập<Icon
        name="arrow_forward"/></Link><Link to="/dang-ky">Chưa có tài khoản? Đăng ký</Link></div>;
    return <>{children}</>;
}

export function TrustStrip() {
    return <div
        className="marketplace-trust">{[['fact_check', 'Kiểm định thiết bị', 'Đọc báo cáo tình trạng trước khi mua'], ['shield', 'An tâm giao dịch', 'Thông tin và trạng thái minh bạch'], ['support_agent', 'Đồng hành cùng bạn', 'Theo dõi đơn ngay trong tài khoản']].map(([icon, title, text]) =>
        <div key={icon}><Icon name={icon}/><span><strong>{title}</strong><small>{text}</small></span></div>)}</div>;
}
