import {requestResult} from './marketplace';

export type ListingAction = 'hide' | 'delete';
const editable = new Set(['DRAFT', 'NEEDS_REVISION', 'PUBLISHED', 'HIDDEN', 'REJECTED', 'AI_REVIEW', 'PENDING_REVIEW']);
export const canEditListing = (status?: string) => editable.has(status ?? '');
export const canWithdrawListing = (status?: string) => editable.has(status ?? '');

export function withdrawListing(id: string, action: ListingAction, reason: string) {
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length > 2000) throw new Error('Vui lòng nhập lý do, tối đa 2000 ký tự.');
    return requestResult<{id: string; listingStatus: string; deleted: boolean}>(
        `/api/marketplace/listings/${encodeURIComponent(id)}/${action}`, {reason: trimmed});
}
