import {afterEach, expect, it, vi} from 'vitest';
import {maxPhotoBytes, uploadListingPhoto, validatePhotoSelection} from './listingPhotos';

afterEach(() => vi.unstubAllGlobals());
it('accepts supported image files and rejects overflow without discarding existing photos', () => {
    const png = new File(['fixture'], 'camera.png', {type: 'image/png'});
    expect(validatePhotoSelection(7, [png])).toBeNull();
    expect(validatePhotoSelection(8, [png])).toContain('8 ảnh');
    expect(validatePhotoSelection(0, [new File(['x'], 'evidence.pdf', {type: 'application/pdf'})])).toContain('JPG hoặc PNG');
});
it('rejects empty and oversized images before a listing is submitted', () => {
    expect(validatePhotoSelection(0, [new File([], 'empty.png', {type: 'image/png'})])).toContain('tệp rỗng');
    const huge = new File([new Uint8Array(maxPhotoBytes + 1)], 'large.jpg', {type: 'image/jpeg'});
    expect(validatePhotoSelection(0, [huge])).toContain('5 MB');
});
it('uploads the chosen file as multipart with a fresh CSRF token and no manual boundary', async () => {
    const file = new File(['fixture'], 'camera.png', {type: 'image/png'});
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({headerName: 'X-CSRF-TOKEN', token: 'fresh'}))
        .mockResolvedValueOnce(Response.json({id: 'media-id'}));
    vi.stubGlobal('fetch', fetcher);
    await uploadListingPhoto('listing-id', file);
    expect(fetcher.mock.calls[1][0]).toBe('/api/marketplace/listings/listing-id/media');
    expect(fetcher.mock.calls[1][1].headers).toEqual({'X-CSRF-TOKEN': 'fresh'});
    expect(fetcher.mock.calls[1][1].body.get('file')).toBe(file);
});
it('shows the actual server rejection instead of an unrelated generic message', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({headerName: 'X-CSRF-TOKEN', token: 'fresh'}))
        .mockResolvedValueOnce(Response.json({message: 'Ảnh tối đa 24 megapixel.'}, {status: 400}));
    vi.stubGlobal('fetch', fetcher);
    await expect(uploadListingPhoto('listing-id', new File(['x'], 'camera.png', {type: 'image/png'})))
        .rejects.toThrow('Ảnh tối đa 24 megapixel.');
});
it('does not upload when the security token is invalid', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({headerName: 'unexpected', token: 'token'}));
    vi.stubGlobal('fetch', fetcher);
    await expect(uploadListingPhoto('listing-id', new File(['x'], 'camera.png', {type: 'image/png'}))).rejects.toThrow('phiên bảo mật');
    expect(fetcher).toHaveBeenCalledTimes(1);
});
