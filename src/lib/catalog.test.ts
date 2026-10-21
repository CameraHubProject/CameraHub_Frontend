import { afterEach, expect, it, vi } from 'vitest';
import { fetchFeaturedProducts } from './catalog';

afterEach(() => vi.unstubAllGlobals());

it('preserves an empty feed as empty', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ items: [] })));
  await expect(fetchFeaturedProducts()).resolves.toEqual([]);
});

it('rejects failed requests so the page can show retry', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
  await expect(fetchFeaturedProducts()).rejects.toThrow('Chưa tải được tin đăng.');
});

it('rejects numeric prices that may have lost integer precision', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ items: [{ id: '1', title: 'Máy ảnh', brand: 'Sony', modelName: 'A7', conditionNotes: '', priceVnd: 24500000, shutterCount: null, deviceType: 'BODY', inspectionBadge: 'NOT_INSPECTED' }] })));
  await expect(fetchFeaturedProducts()).rejects.toThrow('Thông tin thiết bị không hợp lệ.');
});
