import type {DeviceType} from './deviceTypes';

export interface Product {
    id: string;
    title: string;
    brand: string;
    modelName: string;
    deviceType: DeviceType;
    priceVnd: string;
    shutterCount: number | null;
    conditionNotes: string;
    inspectionBadge: 'NOT_INSPECTED' | 'CERTIFIED' | 'NOT_CERTIFIED' | 'EXPIRED';
    description?: string;
    images?: string[];
    accessories?: string | null;
    repairHistory?: string | null;
    listingStatus?: string;
    moderationSource?: string | null;
    moderationRevision?: number;
    moderationNote?: string | null;
    sellerId?: string;
    sellerName?: string;
    presentation?: {
        purposes?: string[];
        conditionGrade?: string;
        score?: number;
        warrantyMonths?: number;
        originalPriceVnd?: string;
        imageUrl?: string
    };
    specs?: Record<string, string>;
    inspectionChecks?: { name: string; result: string; notes: string | null }[];
}

export interface ProductFilters {
    query: string;
    brand: string;
    deviceType: string;
    budget: string;
}

export function formatVnd(value: string): string {
    if (!/^\d+$/.test(value)) throw new Error('Số tiền không hợp lệ.');
    return `${BigInt(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}\u00a0₫`;
}

function normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi-VN').trim();
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
    const words = normalize(filters.query).split(/\s+/).filter(Boolean);
    const [min, max] = filters.budget ? filters.budget.split('-') : ['', ''];
    return products.filter((product) => {
        const searchable = normalize(`${product.title} ${product.brand} ${product.modelName} ${product.conditionNotes}`);
        const price = BigInt(product.priceVnd);
        return words.every((word) => searchable.includes(word))
            && (!filters.brand || normalize(product.brand) === normalize(filters.brand))
            && (!filters.deviceType || product.deviceType === filters.deviceType)
            && (!min || price >= BigInt(min))
            && (!max || price < BigInt(max));
    });
}

