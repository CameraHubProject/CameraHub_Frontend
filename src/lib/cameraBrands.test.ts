import {describe, expect, it} from 'vitest';
import {CAMERA_BRANDS, brandSelectionFor, cameraBrandPayload} from './cameraBrands';

function data(brandName: string, customBrandName = '') {
    const form = new FormData();
    form.set('brandName', brandName);
    form.set('customBrandName', customBrandName);
    return form;
}

describe('camera brand selection', () => {
    it('preserves the requested order, spelling and final custom option', () => {
        expect(CAMERA_BRANDS).toEqual(['Canon', 'Sony', 'Nikon', 'Fujifilm', 'Panasonic', 'Olympus', 'OM System', 'Pentax', 'Ricoh', 'Leica', 'Kodak', 'Casio', 'Samsung', 'Minolta', 'Hasselblad', 'Sigma', 'GoPro', 'DJI', 'Insta360', 'Polaroid', 'Phase One', 'Mamiya', 'Yashica', 'Konica', 'Rollei', 'Voigtländer', 'Lomography', 'Blackmagic Design', 'RED', 'ARRI', 'Z CAM', 'Kinefinity', 'AKASO', 'SJCAM', 'Khác']);
    });
    it('sends each standard selection and excludes stale custom input', () => {
        for (const brand of CAMERA_BRANDS.filter(name => name !== 'Khác')) expect(cameraBrandPayload(data(brand, 'Old name'))).toEqual({brandName: brand});
    });
    it('sends custom input to the backend and restores normalized backend names when editing', () => {
        const payload = cameraBrandPayload(data('Khác', '  Máy   Ảnh Việt  '));
        expect(payload).toEqual({brandName: 'Khác', customBrandName: '  Máy   Ảnh Việt  '});
        expect(brandSelectionFor('Máy Ảnh Việt')).toEqual({brandName:'Khác',customBrandName:'Máy Ảnh Việt'});
        expect(brandSelectionFor('canon')).toEqual({brandName: 'Canon', customBrandName: ''});
        expect(brandSelectionFor()).toEqual({brandName: '', customBrandName: ''});
    });
    it('delegates business validation to backend rather than maintaining client error messages', () => {
        for (const value of ['', 'Unknown']) expect(cameraBrandPayload(data(value))).toEqual({brandName:value});
        for (const value of ['', '   ', 'Khác', 'a'.repeat(101)]) expect(cameraBrandPayload(data('Khác',value))).toEqual({brandName:'Khác',customBrandName:value});
    });
});
