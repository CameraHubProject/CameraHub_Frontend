import {afterEach, describe, expect, it, vi} from 'vitest';
import {fetchSellerListings, fetchSellerProfile, fetchSellerReviews, submitSellerReview} from './marketplace';

afterEach(() => vi.unstubAllGlobals());

describe('public seller profiles', () => {
    it('requests public inventory by visibility and page, without requiring a login', async () => {
        const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json({
            items: [],
            total: 0,
            page: 2,
            pageSize: 12
        })));
        vi.stubGlobal('fetch', fetcher);
        await fetchSellerProfile('member/id');
        await fetchSellerListings('member/id', 'SOLD', 2);
        await fetchSellerReviews('member/id', 2);
        expect(fetcher.mock.calls.map(call => call[0])).toEqual(['/api/public/sellers/member%2Fid', '/api/public/sellers/member%2Fid/listings?status=SOLD&page=2', '/api/public/sellers/member%2Fid/reviews?page=2']);
        expect(fetcher.mock.calls.every(call => call[1].method === 'GET')).toBe(true);
    });
    it('submits a rating for an order with CSRF and leaves buyer and seller identity to the server', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(Response.json({
            headerName: 'X-CSRF-TOKEN',
            token: 'review-csrf'
        })).mockResolvedValueOnce(Response.json({id: 'review'}));
        vi.stubGlobal('fetch', fetcher);
        await expect(submitSellerReview('order/id', 4, 'Thiết bị đúng mô tả')).resolves.toEqual({id: 'review'});
        expect(fetcher.mock.calls[1][0]).toBe('/api/marketplace/orders/order%2Fid/seller-review');
        expect(fetcher.mock.calls[1][1].headers['X-CSRF-TOKEN']).toBe('review-csrf');
        expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({rating: 4, comment: 'Thiết bị đúng mô tả'});
    });
});
