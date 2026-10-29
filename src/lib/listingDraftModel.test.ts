import {expect, it} from 'vitest';
import {listingDraftModel} from './listingDraftModel';

it('reselects the model when adding a lens without changing the brand', () => {
    const data = new FormData();
    data.set('brandName', 'Canon');
    data.set('deviceType', 'BODY_LENS');
    expect(listingDraftModel(data, {brand: 'Canon', deviceType: 'BODY', modelId: 'body-model'}))
        .toEqual({brandName: 'Canon'});
});

it('keeps a real camera model when brand and device type are unchanged', () => {
    const data = new FormData();
    data.set('brandName', 'Canon');
    data.set('deviceType', 'BODY_LENS');
    expect(listingDraftModel(data, {brand: 'Canon', deviceType: 'BODY_LENS', modelId: 'kit-model'}))
        .toEqual({modelId: 'kit-model'});
});
