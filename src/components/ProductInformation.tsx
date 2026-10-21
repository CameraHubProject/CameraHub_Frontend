import type { Product } from '../lib/products';
import { formatVnd } from '../lib/products';
import { Icon } from './ui';

export function ProductInformation({ product }: { product: Product }) {
  return <div className="product-detail"><p className="eyebrow">{product.brand} · {product.modelName}</p><p className="detail-price">{formatVnd(product.priceVnd)}</p><dl><div><dt>Loại thiết bị</dt><dd>{product.deviceType === 'BODY' ? 'Thân máy ảnh' : product.deviceType === 'LENS' ? 'Ống kính' : 'Thiết bị khác'}</dd></div><div><dt>Số lần chụp</dt><dd>{product.shutterCount === null ? 'Chưa được cung cấp' : new Intl.NumberFormat('vi-VN').format(product.shutterCount)}</dd></div><div><dt>Kiểm định</dt><dd>{product.inspectionBadge === 'CERTIFIED' ? 'Có huy hiệu kiểm định' : product.inspectionBadge === 'EXPIRED' ? 'Huy hiệu kiểm định đã hết hạn' : product.inspectionBadge === 'NOT_CERTIFIED' ? 'Chưa đạt chứng nhận' : 'Chưa được kiểm định'}</dd></div></dl><h3>Tình trạng người bán cung cấp</h3><p>{product.conditionNotes}</p><div className="detail-note"><Icon name="info" />Thông tin tình trạng do người bán cung cấp. Hình minh họa không phải ảnh chụp thiết bị thực tế.</div></div>;
}
