import {describe, expect, it} from 'vitest';
import {filterCatalog, parseCatalogFilters, serializeCatalogFilters} from './catalogFilters';
import type {Product} from './products';

function product(id: string, overrides: Partial<Product> = {}): Product {
    return {
        id,
        title: 'Máy ảnh mẫu',
        brand: 'Canon',
        modelName: 'EOS R6',
        deviceType: 'BODY',
        priceVnd: '15000000',
        shutterCount: 12000,
        conditionNotes: 'Có xước nhẹ',
        inspectionBadge: 'NOT_INSPECTED', ...overrides
    };
}

describe('catalog filters shared through URLs', () => {
    it('keeps body and lens kits selectable through shared filters', () => {
        const filters = parseCatalogFilters(new URLSearchParams('type=BODY_LENS'));
        expect(filters.types).toEqual(['BODY_LENS']);
        expect(filterCatalog([product('kit', {deviceType: 'BODY_LENS'}), product('body')], filters).map(item => item.id))
            .toEqual(['kit']);
    });
    it('preserves combined filters and multiple brands on a shared URL', () => {
        const source = new URLSearchParams('q=ống+kính&brand=Canon&brand=Sony&type=LENS&budget=0-10000000&inspection=NOT_INSPECTED&sort=price-asc');
        const filters = parseCatalogFilters(source);
        expect(parseCatalogFilters(serializeCatalogFilters(filters))).toEqual(filters);
        expect(filters.brands).toEqual(['Canon', 'Sony']);
    });
    it('combines brand alternatives with type, budget and actual inspection status', () => {
        const fixtures = [product('match', {
            brand: 'Sony',
            deviceType: 'LENS',
            priceVnd: '3900000',
            shutterCount: null
        }),
            product('expensive', {brand: 'Sony', deviceType: 'LENS'}), product('unselected-brand', {
                brand: 'Sigma',
                deviceType: 'LENS',
                priceVnd: '3900000'
            }),
            product('wrong-status', {
                brand: 'Canon',
                deviceType: 'LENS',
                priceVnd: '3900000',
                inspectionBadge: 'CERTIFIED'
            })];
        const filters = parseCatalogFilters(new URLSearchParams('brand=Canon&brand=Sony&type=LENS&budget=0-10000000&inspection=NOT_INSPECTED'));
        expect(filterCatalog(fixtures, filters).map(item => item.id)).toEqual(['match']);
    });
    it('sorts integer VND beyond JavaScript safe precision without mutating the feed', () => {
        const fixtures = [product('higher', {priceVnd: '9007199254740993'}), product('lower', {priceVnd: '9007199254740992'})];
        expect(filterCatalog(fixtures, parseCatalogFilters(new URLSearchParams('sort=price-asc'))).map(item => item.id)).toEqual(['lower', 'higher']);
        expect(fixtures.map(item => item.id)).toEqual(['higher', 'lower']);
    });
    it('keeps missing shutter counts out of thresholds and places them last in shutter sorting', () => {
        const fixtures = [product('missing', {shutterCount: null}), product('used'), product('zero', {shutterCount: 0})];
        expect(filterCatalog(fixtures, parseCatalogFilters(new URLSearchParams('shutter=5000'))).map(item => item.id)).toEqual(['zero']);
        expect(filterCatalog(fixtures, parseCatalogFilters(new URLSearchParams('sort=shutter-asc'))).map(item => item.id)).toEqual(['zero', 'used', 'missing']);
    });
    it('ignores unsupported values instead of applying invalid prices or fake certification', () => {
        const filters = parseCatalogFilters(new URLSearchParams('budget=oops&type=UNKNOWN&inspection=PASS&sort=arbitrary&shutter=-5'));
        expect(filters).toMatchObject({budget: '', types: [], inspection: '', sort: 'newest', shutter: ''});
        expect(filterCatalog([product('visible')], filters)).toHaveLength(1);
    });
});
