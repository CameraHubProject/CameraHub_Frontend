import {afterEach, expect, it, vi} from 'vitest';
import {fetchFeaturedProducts} from './catalog';

afterEach(() => vi.unstubAllGlobals());

it('loads body and lens kits from the API', async () => {
    const kit = {id: 'kit', title: 'Canon kèm lens', brand: 'Canon', modelName: 'Chưa xác định',
        conditionNotes: 'Đã sử dụng', priceVnd: '6000000', shutterCount: null,
        deviceType: 'BODY_LENS', inspectionBadge: 'NOT_INSPECTED'};
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({items: [kit]})));
    await expect(fetchFeaturedProducts()).resolves.toEqual([kit]);
});

it('preserves an empty feed as empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({items: []})));
    await expect(fetchFeaturedProducts()).resolves.toEqual([]);
});

it('rejects failed requests so the page can show retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', {status: 503})));
    await expect(fetchFeaturedProducts()).rejects.toThrow('Không nhận được phản hồi hợp lệ từ máy chủ.');
});

it('rejects numeric prices that may have lost integer precision', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
        items: [{
            id: '1',
            title: 'Máy ảnh',
            brand: 'Sony',
            modelName: 'A7',
            conditionNotes: '',
            priceVnd: 24500000,
            shutterCount: null,
            deviceType: 'BODY',
            inspectionBadge: 'NOT_INSPECTED'
        }]
    })));
    await expect(fetchFeaturedProducts()).rejects.toThrow('Thông tin thiết bị không hợp lệ.');
});
