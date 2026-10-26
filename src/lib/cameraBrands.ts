export const CAMERA_BRANDS = [
    'Canon', 'Sony', 'Nikon', 'Fujifilm', 'Panasonic', 'Olympus', 'OM System', 'Pentax',
    'Ricoh', 'Leica', 'Kodak', 'Casio', 'Samsung', 'Minolta', 'Hasselblad', 'Sigma',
    'GoPro', 'DJI', 'Insta360', 'Polaroid', 'Phase One', 'Mamiya', 'Yashica', 'Konica',
    'Rollei', 'Voigtländer', 'Lomography', 'Blackmagic Design', 'RED', 'ARRI', 'Z CAM',
    'Kinefinity', 'AKASO', 'SJCAM', 'Khác',
] as const;

export function brandSelectionFor(name = '', available: readonly string[] = CAMERA_BRANDS) {
    const normalized = name.trim();
    const known = available.find(brand => brand !== 'Khác' && brand.toLocaleLowerCase() === normalized.toLocaleLowerCase());
    return {brandName: known ?? (normalized ? 'Khác' : ''), customBrandName: known ? '' : normalized};
}

export function cameraBrandPayload(data: FormData, _available?: readonly string[]) {
    const brandName=String(data.get('brandName') ?? '');
    return brandName==='Khác'?{brandName,customBrandName:String(data.get('customBrandName') ?? '')}:{brandName};
}
