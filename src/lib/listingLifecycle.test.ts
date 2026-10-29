import {afterEach, expect, it, vi} from 'vitest';
import {withdrawListing, canEditListing, canWithdrawListing} from './listingLifecycle';

afterEach(() => vi.unstubAllGlobals());

it('does not send a hide/delete request until a nonblank reason is supplied', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(() => withdrawListing('listing','hide','   ')).toThrow('Vui lòng nhập lý do');
    expect(() => withdrawListing('listing','delete','x'.repeat(2001))).toThrow('Vui lòng nhập lý do');
    expect(fetch).not.toHaveBeenCalled();
});

it('posts the confirmed action with CSRF and the trimmed reason', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({headerName:'X-CSRF-TOKEN', token:'csrf'}))
        .mockResolvedValueOnce(Response.json({success:true,code:'OK',message:'Đã ẩn tin',data:{id:'listing',listingStatus:'HIDDEN',deleted:false}}));
    vi.stubGlobal('fetch', fetch);
    await withdrawListing('listing','hide','  Tạm ngừng bán  ');
    expect(fetch).toHaveBeenLastCalledWith('/api/marketplace/listings/listing/hide',expect.objectContaining({
        method:'POST', body:JSON.stringify({reason:'Tạm ngừng bán'}), headers:expect.objectContaining({'X-CSRF-TOKEN':'csrf'})
    }));
});

it('lets owners edit hidden/rejected listings while protecting reserved/sold listings', () => {
    expect(canEditListing('HIDDEN')).toBe(true);
    expect(canEditListing('REJECTED')).toBe(true);
    for (const status of ['RESERVED','SOLD',undefined]) {
        expect(canEditListing(status)).toBe(false);
        expect(canWithdrawListing(status)).toBe(false);
    }
});
