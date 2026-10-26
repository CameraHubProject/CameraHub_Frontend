import {checkedResponse} from './apiResponse';
import {request} from './marketplace';

export const maxListingPhotos = 8;
export const maxPhotoBytes = 5 * 1024 * 1024;

export interface ListingPhoto {
    key: string;
    file: File;
    previewUrl: string;
    status: 'ready' | 'uploading' | 'uploaded' | 'error';
    error?: string;
}

export function validatePhotoSelection(existingCount: number, files: File[]): string | null {
    if (existingCount + files.length > maxListingPhotos) return 'Mỗi tin đăng có tối đa 8 ảnh. Hãy bỏ bớt ảnh trước khi chọn thêm.';
    for (const file of files) {
        if (!['image/jpeg', 'image/png'].includes(file.type)) return `“${file.name}” chưa đúng định dạng. Vui lòng chọn ảnh JPG hoặc PNG.`;
        if (!file.size) return `“${file.name}” là tệp rỗng. Vui lòng chọn lại ảnh.`;
        if (file.size > maxPhotoBytes) return `“${file.name}” vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.`;
    }
    return null;
}

export async function uploadListingPhoto(id: string, file: File): Promise<void> {
    const csrf = await request<{ headerName: string; token: string }>('/api/auth/csrf');
    if (csrf.headerName !== 'X-CSRF-TOKEN' || !csrf.token) throw new Error('Chưa khởi tạo được phiên bảo mật. Vui lòng thử lại.');
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(`/api/marketplace/listings/${encodeURIComponent(id)}/media`, {
        method: 'POST', credentials: 'same-origin', headers: {[csrf.headerName]: csrf.token}, body,
        signal: AbortSignal.timeout(30_000),
    });
    await checkedResponse(response);
}
