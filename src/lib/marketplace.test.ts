import {afterEach, expect, it, vi} from 'vitest';
import {depositFor, request} from './marketplace';
import {parseCart} from './cart';
import {filterCatalog, parseCatalogFilters, serializeCatalogFilters} from './catalogFilters';
import type {Product} from './products';

afterEach(() => vi.unstubAllGlobals());
it('rounds each 30 percent deposit to whole VND without losing large integer precision', () => {
    expect(depositFor('24500000')).toBe(7350000n);
    expect(depositFor('1001')).toBe(300n);
    expect(depositFor('1002')).toBe(301n);
    expect(depositFor('9007199254740993')).toBe(2702159776422298n);
});
it('restores only unique product IDs from device storage and tolerates malformed values', () => {
    const id = 'c206b895-882a-4f10-848d-98bece85c396';
    expect(parseCart(JSON.stringify([id, id, '../private', null, {}, 123]))).toEqual([id]);
    expect(parseCart('{')).toEqual([]);
    expect(parseCart('null')).toEqual([]);
});
it('combines known use cases with budget without inventing purpose metadata', () => {
    const base: Product = {
        id: 'a',
        title: 'Camera',
        brand: 'Sony',
        modelName: 'Test',
        deviceType: 'BODY',
        priceVnd: '15000000',
        shutterCount: 0,
        conditionNotes: 'Used',
        inspectionBadge: 'NOT_INSPECTED'
    };
    const filters = parseCatalogFilters(new URLSearchParams('purpose=TRAVEL&purpose=INVALID&budget=10000000-20000000'));
    expect(parseCatalogFilters(serializeCatalogFilters(filters))).toEqual(filters);
    expect(filterCatalog([base, {
        ...base,
        id: 'b',
        presentation: {purposes: ['TRAVEL']}
    }], filters).map(item => item.id)).toEqual(['b']);
});
it('fetches a fresh CSRF token before each mutation and sends only the expected header', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({
        headerName: 'X-CSRF-TOKEN',
        token: 'fresh'
    })).mockResolvedValueOnce(Response.json({id: 'created'}));
    vi.stubGlobal('fetch', fetcher);
    expect(await request('/api/marketplace/checkout', {requestId: 'fixture'})).toEqual({id: 'created'});
    expect(fetcher.mock.calls[1][1]).toMatchObject({
        method: 'POST',
        credentials: 'same-origin',
        headers: {'X-CSRF-TOKEN': 'fresh', 'Content-Type': 'application/json'}
    });
});
it('preserves actionable API conflicts for the checkout form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({message: 'Thiết bị vừa hết hàng.'}, {status: 409})));
    await expect(request('/api/public/products/missing')).rejects.toThrow('Thiết bị vừa hết hàng.');
});
