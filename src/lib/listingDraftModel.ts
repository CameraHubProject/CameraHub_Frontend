import type {Product} from './products';

export function listingDraftModel(data: FormData, draft: Pick<Product, 'brand' | 'deviceType'> & {modelId: string}) {
    const sameBrand = data.get('brandName') === draft.brand
        || (data.get('brandName') === 'Khác' && data.get('customBrandName') === draft.brand);
    if (sameBrand && data.get('deviceType') === draft.deviceType) return {modelId: draft.modelId};
    return {
        brandName: data.get('brandName'),
        ...(data.get('brandName') === 'Khác' ? {customBrandName: data.get('customBrandName')} : {}),
    };
}
