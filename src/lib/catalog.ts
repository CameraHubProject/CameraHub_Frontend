import {deviceTypes} from './deviceTypes';
import type {DeviceType} from './deviceTypes';
import {readApi, checkedResponse} from './apiResponse';
import type {Product} from './products';

export async function fetchFeaturedProducts(): Promise<Product[]> {
    const response = await fetch('/api/public/products', {signal: AbortSignal.timeout(10_000)});
    await checkedResponse(response);
    const data: unknown = await readApi(response);
    if (typeof data !== 'object' || data === null || !('items' in data) || !Array.isArray(data.items)) {
        throw new Error('Dữ liệu tin đăng không hợp lệ.');
    }
    if (!data.items.every(isProduct)) throw new Error('Thông tin thiết bị không hợp lệ.');
    return data.items;
}

function isProduct(value: unknown): value is Product {
    if (typeof value !== 'object' || value === null) return false;
    const item = value as Record<string, unknown>;
    return ['id', 'title', 'brand', 'modelName', 'conditionNotes'].every((key) => typeof item[key] === 'string')
        && typeof item.priceVnd === 'string' && /^[1-9]\d*$/.test(item.priceVnd)
        && (item.shutterCount === null || (typeof item.shutterCount === 'number' && Number.isSafeInteger(item.shutterCount) && item.shutterCount >= 0))
        && deviceTypes.includes(item.deviceType as DeviceType)
        && ['NOT_INSPECTED', 'CERTIFIED', 'NOT_CERTIFIED', 'EXPIRED'].includes(String(item.inspectionBadge));
}
