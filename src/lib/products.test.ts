import {describe, expect, it} from 'vitest';
import {filterProducts, formatVnd} from './products';
import type {Product, ProductFilters} from './products';

const filters: ProductFilters = {query: '', brand: '', deviceType: '', budget: ''};
const product: Product = {
    id: '1',
    title: 'Máy ảnh Sony A7',
    brand: 'Sony',
    modelName: 'A7',
    deviceType: 'BODY',
    priceVnd: '24500000',
    shutterCount: 1000,
    conditionNotes: 'Đầy đủ phụ kiện',
    inspectionBadge: 'NOT_INSPECTED'
};

describe('integer VND presentation', () => {
    it('uses dot grouping and a non-breaking space', () => expect(formatVnd('24500000')).toBe('24.500.000\u00a0₫'));
    it('retains precision beyond JavaScript safe integers', () => expect(formatVnd('9007199254740993')).toBe('9.007.199.254.740.993\u00a0₫'));
    it('formats a zero fee', () => expect(formatVnd('0')).toBe('0\u00a0₫'));
    it('refuses fractional money', () => expect(() => formatVnd('24.5')).toThrow());
});

describe('real product filtering', () => {
    it('supports Vietnamese search without accents', () => expect(filterProducts([product], {
        ...filters,
        query: 'may anh day du'
    })).toEqual([product]));
    it('combines brand, device type and budget', () => expect(filterProducts([product], {
        ...filters,
        brand: 'sony',
        deviceType: 'BODY',
        budget: '20000000-35000000'
    })).toEqual([product]));
    it('does not invent a match for an unavailable brand', () => expect(filterProducts([product], {
        ...filters,
        brand: 'Leica'
    })).toEqual([]));
    it('does not include a price at the exclusive upper budget boundary', () => expect(filterProducts([{
        ...product,
        priceVnd: '10000000'
    }], {...filters, budget: '0-10000000'})).toEqual([]));
});
