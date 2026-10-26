import type {Product} from './products';
import {filterProducts} from './products';

export const budgets = [['', 'Tất cả mức giá'], ['0-10000000', 'Dưới 10 triệu'], ['10000000-20000000', '10 – 20 triệu'], ['20000000-35000000', '20 – 35 triệu'], ['35000000-', 'Từ 35 triệu']] as const;

export interface CatalogFilters {
    query: string;
    brands: string[];
    types: string[];
    purposes: string[];
    budget: string;
    inspection: string;
    shutter: string;
    sort: string
}

const validTypes = ['BODY', 'LENS', 'OTHER'];
const inspections = ['NOT_INSPECTED', 'CERTIFIED', 'NOT_CERTIFIED', 'EXPIRED'];
const sorts = ['newest', 'price-asc', 'price-desc', 'shutter-asc'];

export function parseCatalogFilters(params: URLSearchParams): CatalogFilters {
    return {
        query: params.get('q') ?? '', brands: [...new Set(params.getAll('brand'))],
        purposes: [...new Set(params.getAll('purpose').filter(value => ['TRAVEL', 'VLOG', 'PRO', 'BEGINNER'].includes(value)))],
        types: [...new Set(params.getAll('type').filter(type => validTypes.includes(type)))],
        budget: budgets.some(([value]) => value === params.get('budget')) ? params.get('budget')! : '',
        inspection: inspections.includes(params.get('inspection') ?? '') ? params.get('inspection')! : '',
        shutter: ['5000', '15000'].includes(params.get('shutter') ?? '') ? params.get('shutter')! : '',
        sort: sorts.includes(params.get('sort') ?? '') ? params.get('sort')! : 'newest'
    };
}

export function serializeCatalogFilters(filters: CatalogFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.query.trim()) params.set('q', filters.query.trim());
    filters.brands.forEach(brand => params.append('brand', brand));
    filters.types.forEach(type => params.append('type', type));
    filters.purposes.forEach(purpose => params.append('purpose', purpose));
    if (filters.budget) params.set('budget', filters.budget);
    if (filters.inspection) params.set('inspection', filters.inspection);
    if (filters.shutter) params.set('shutter', filters.shutter);
    if (filters.sort !== 'newest') params.set('sort', filters.sort);
    return params;
}

export function filterCatalog(products: Product[], filters: CatalogFilters): Product[] {
    const items = filterProducts(products, {query: filters.query, brand: '', deviceType: '', budget: filters.budget})
        .filter(item => (!filters.brands.length || filters.brands.includes(item.brand)) && (!filters.types.length || filters.types.includes(item.deviceType))
            && (!filters.purposes.length || filters.purposes.some(purpose => item.presentation?.purposes?.includes(purpose)))
            && (!filters.inspection || item.inspectionBadge === filters.inspection)
            && (!filters.shutter || item.shutterCount !== null && item.shutterCount < Number(filters.shutter)));
    return items.sort((a, b) => {
        if (filters.sort === 'shutter-asc') return (a.shutterCount ?? Infinity) - (b.shutterCount ?? Infinity);
        if (filters.sort === 'price-asc' || filters.sort === 'price-desc') {
            const result = BigInt(a.priceVnd) < BigInt(b.priceVnd) ? -1 : BigInt(a.priceVnd) > BigInt(b.priceVnd) ? 1 : 0;
            return filters.sort === 'price-asc' ? result : -result;
        }
        return 0;
    });
}
