import type { Product } from './products';

export interface Address { id?: string; recipientName: string; phone: string; province: string; streetAddress: string; isDefault: boolean }
export interface Order { id: string; productId: string; buyerId: string; sellerId: string; status: string; title: string; priceVnd: string; totalVnd: string; shippingFeeVnd: string; depositVnd: string; depositRateBps: number; balanceVnd: string; createdAt: string; paymentDeadline: string; address?: Address & { delivery?: string; showroom?: { name: string; address: string } }; payments?: { stage: string; amountVnd: string; status: string; createdAt: string }[] }
export interface Model { id: string; brand: string; modelName: string; deviceType: string }
export interface Brand { id: string; name: string }
export interface Showroom { id: string; name: string; address: string }
export interface Buyback { id: string; model: string; conditionNotes: string; expectedPriceVnd: string | null; status: string; createdAt: string }
export const purposes = [['TRAVEL', 'Chụp du lịch / đường phố', 'travel_explore'], ['VLOG', 'Làm vlog sáng tạo & TikTok', 'videocam'], ['PRO', 'Chụp dịch vụ / Sự kiện', 'photo_camera'], ['BEGINNER', 'Sinh viên nhập môn cơ bản', 'school']] as const;
export const orderLabels: Record<string, string> = { AWAITING_DEPOSIT: 'Chờ đặt cọc', AWAITING_BALANCE: 'Chờ thanh toán còn lại', READY_TO_SHIP: 'Đang chuẩn bị hàng', SHIPPING: 'Đang vận chuyển', DELIVERED: 'Đã giao hàng', PROTECTION_ACTIVE: 'Trong thời gian bảo vệ', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy', DISPUTED: 'Đang xử lý khiếu nại', REFUND_PROCESSING: 'Đang hoàn tiền', CANCELLATION_REVIEW: 'Đang xét hủy', DELIVERY_EXCEPTION: 'Sự cố giao hàng' };
export async function request<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'same-origin', signal: AbortSignal.timeout(10_000) });
    if (!csrfResponse.ok) throw new Error('Không khởi tạo được phiên bảo mật.');
    const csrf = await csrfResponse.json() as { headerName: string; token: string };
    if (csrf.headerName !== 'X-CSRF-TOKEN' || !csrf.token) throw new Error('Phiên bảo mật không hợp lệ.');
    headers[csrf.headerName] = csrf.token; headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30_000) });
  if (!response.ok) { const error = await response.json().catch(() => ({})) as { message?: string }; throw new Error(error.message ?? (response.status === 401 ? 'Vui lòng đăng nhập để tiếp tục.' : 'Chưa thực hiện được yêu cầu. Vui lòng thử lại.')); }
  if (response.status === 204 || response.headers.get('content-length') === '0') return undefined as T;
  const text = await response.text(); return text ? JSON.parse(text) as T : undefined as T;
}
export const fetchProduct = (id: string) => request<Product>(`/api/public/products/${encodeURIComponent(id)}`);
export const fetchOrders = () => request<Order[]>('/api/marketplace/orders');
export const fetchOrder = (id: string) => request<Order>(`/api/marketplace/orders/${encodeURIComponent(id)}`);
export const fetchAddresses = () => request<Address[]>('/api/marketplace/addresses');
export const fetchModels = () => request<Model[]>('/api/public/models');
export const fetchBrands = () => request<Brand[]>('/api/public/brands');
export const fetchShowrooms = () => request<Showroom[]>('/api/public/showrooms');
export const fetchListings = () => request<Product[]>('/api/marketplace/listings');
export const fetchBuybacks = () => request<Buyback[]>('/api/marketplace/buyback');
export function depositFor(price: string): bigint { return (BigInt(price) * 3000n + 5000n) / 10000n; }
