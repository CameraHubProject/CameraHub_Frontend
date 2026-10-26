import {describe, expect, it, vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {PublicProfilePage} from './PublicProfilePage';
import {SellerOrderReview} from './SellerOrderReview';

vi.mock('./SiteLayout', () => ({SiteHeader: () => null, SiteFooter: () => null}));

function renderProfile(tab = 'selling') {
    const client = new QueryClient({defaultOptions: {queries: {retry: false, staleTime: Infinity}}});
    client.setQueryData(['session'], null);
    client.setQueryData(['seller-profile', 'member'], {
        id: 'member',
        fullName: 'Người bán công khai',
        joinedAt: '2026-10-01T00:00:00Z',
        verified: false,
        sellingCount: 0,
        soldCount: 1,
        reviewCount: 0,
        averageRating: null
    });
    client.setQueryData(['seller-listings', 'member', tab, 0], {
        items: tab === 'sold' ? [{
            id: 'sold-camera',
            title: 'Máy đã bán',
            brand: 'Canon',
            deviceType: 'BODY',
            priceVnd: '12000000',
            conditionNotes: 'Đã sử dụng',
            shutterCount: null,
            listingStatus: 'SOLD'
        }] : [], total: tab === 'sold' ? 1 : 0, page: 0, pageSize: 12
    });
    client.setQueryData(['seller-reviews', 'member', 0], {items: [], total: 0, page: 0, pageSize: 12});
    return renderToStaticMarkup(<QueryClientProvider client={client}><MemoryRouter
        initialEntries={[`/thanh-vien/member?tab=${tab}`]}><Routes><Route path="/thanh-vien/:id" element={
        <PublicProfilePage/>}/></Routes></MemoryRouter></QueryClientProvider>);
}

describe('public profile experience', () => {
    it('lets signed-out visitors see the profile and honest empty rating state', () => {
        const html = renderProfile();
        expect(html).toContain('Người bán công khai');
        expect(html).toContain('Chưa có đánh giá');
        expect(html).toContain('Thiết bị đã bán');
        expect(html).not.toContain('Đăng nhập để tiếp tục');
        expect(html).not.toContain('Người bán đã xác minh');
    });
    it('shows sold equipment with detail links and no purchase actions', () => {
        const html = renderProfile('sold');
        expect(html).toContain('Máy đã bán');
        expect(html).toContain('/may-anh/sold-camera');
        expect(html).not.toContain('Thêm vào giỏ hàng');
        expect(html).not.toContain('Chọn mua ngay');
    });
    it('explains completed-purchase reviews on an empty review tab', () => {
        expect(renderProfile('reviews')).toContain('Đánh giá từ người mua sẽ xuất hiện sau khi giao dịch hoàn tất.');
    });
    it('offers the form only when the order API grants review eligibility', () => {
        const render = (canReview: boolean) => renderToStaticMarkup(<QueryClientProvider
            client={new QueryClient()}><MemoryRouter><SellerOrderReview orderId="order" sellerId="seller"
                                                                        canReview={canReview}/></MemoryRouter></QueryClientProvider>);
        expect(render(true)).toContain('Gửi đánh giá');
        expect(render(false)).not.toContain('Gửi đánh giá');
    });
});
