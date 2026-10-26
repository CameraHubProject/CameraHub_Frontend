import {useEffect, useId, useRef, useState} from 'react';
import type {ButtonHTMLAttributes, InputHTMLAttributes, ReactNode} from 'react';
import {formatVnd} from '../lib/products';
import type {Product} from '../lib/products';
import {EquipmentIllustration} from './EquipmentIllustration';
import {Link} from 'react-router-dom';
import {addToCart, useCart} from '../lib/cart';

export function Icon({name}: { name: string }) {
    return <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;
}

export function Button({
                           variant = 'primary',
                           className = '',
                           loading = false,
                           disabled,
                           children,
                           ...props
                       }: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'light' | 'ghost';
    loading?: boolean
}) {
    return <button className={`button button-${variant} ${className}`} {...props} disabled={disabled || loading}
                   aria-busy={loading || props['aria-busy']}>{loading &&
        <Icon name="progress_activity"/>}{children}</button>;
}

export function Input({label, hideLabel, icon, trailing, id, serverError,
    'aria-describedby': describedBy, ...props}: InputHTMLAttributes<HTMLInputElement> & {
    label: string; hideLabel?: boolean; icon?: string; trailing?: ReactNode; serverError?: string
}) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return <div className="input-field"><label className={hideLabel ? 'sr-only' : ''} htmlFor={fieldId}>{label}</label>
        <div className="input-wrap">{icon && <Icon name={icon}/>}<input id={fieldId} {...props}
            aria-invalid={serverError ? true : props['aria-invalid']}
            aria-describedby={[describedBy, serverError ? fieldId+'-error' : ''].filter(Boolean).join(' ') || undefined}/>{trailing}</div>
        {serverError && <span id={fieldId+'-error'} className="input-error" role="alert">{serverError}</span>}
    </div>;
}

export function EmptyState({icon, title, description, action}: {
    icon: string;
    title: string;
    description: string;
    action?: ReactNode
}) {
    return <div className="empty-state"><span className="empty-icon"><Icon name={icon}/></span><h3>{title}</h3>
        <p>{description}</p>{action}</div>;
}

export function Skeleton() {
    return <div className="skeleton-card" aria-label="Đang tải thiết bị"><span className="skeleton-image"/><span
        className="skeleton-line"/><span className="skeleton-line short"/><span className="skeleton-line"/></div>;
}

export function ConditionBadge({text}: { text: string }) {
    return <span className="condition-badge">{text}</span>;
}

export function StatusBadge({children, verified = false}: { children: ReactNode; verified?: boolean }) {
    return <span className={`status-badge ${verified ? 'verified' : ''}`}>{verified &&
        <Icon name="verified"/>}{children}</span>;
}

export function ProductCard({product, onOpen}: { product: Product; onOpen: () => void }) {
    const cart = useCart();
    const typeLabel = product.deviceType === 'BODY' ? 'Thân máy ảnh' : product.deviceType === 'LENS' ? 'Ống kính' : 'Phụ kiện';
    const inspectionLabel = product.inspectionBadge === 'CERTIFIED' ? 'Có huy hiệu kiểm định' : product.inspectionBadge === 'NOT_CERTIFIED' ? 'Chưa đạt chứng nhận' : product.inspectionBadge === 'EXPIRED' ? 'Huy hiệu đã hết hạn' : 'Chưa kiểm định';
    const original = product.presentation?.originalPriceVnd;
    const hasDiscount = !!original && /^[1-9]\d*$/.test(original) && BigInt(original) > BigInt(product.priceVnd);
    const saving = hasDiscount ? ((BigInt(original!) - BigInt(product.priceVnd)) * 100n / BigInt(original!)).toString() : '';
    return <article className="product-card prototype-product-card"><Link className="product-stage"
                                                                          to={`/may-anh/${product.id}`}><ProductMedia
        product={product}/>
        <div className="product-badges"><ConditionBadge
            text={product.presentation?.conditionGrade ?? typeLabel}/><StatusBadge
            verified={product.inspectionBadge === 'CERTIFIED'}>{inspectionLabel}</StatusBadge>{product.presentation?.score != null &&
            <span className="inspection-score">Điểm {product.presentation.score}/10</span>}</div>
        <div className="product-stage-bottom"><span><Icon
            name={product.shutterCount === null ? 'info' : 'speed'}/>{product.shutterCount === null ? 'Xem mô tả tình trạng' : `${new Intl.NumberFormat('vi-VN').format(product.shutterCount)} shots`}</span><span>{product.presentation?.warrantyMonths ? `${product.presentation.warrantyMonths}M Care` : product.images?.length ? 'Ảnh người bán' : 'Hình minh họa'}</span>
        </div>
    </Link>
        <div className="product-content"><p className="eyebrow">{product.brand} · {product.modelName}</p><h3><Link
            to={`/may-anh/${product.id}`}>{product.title}</Link></h3>{product.sellerId &&
            <Link className="product-seller-name" to={`/thanh-vien/${product.sellerId}`}><Icon
                name="person"/>{product.sellerName || 'Thành viên CameraHub'}<Icon name="chevron_right"/></Link>}
            <div className="product-condition-box"><span>Tình trạng người bán cung cấp</span><p
                className="product-condition">{product.conditionNotes}</p></div>
            <div className="product-price-row"><strong
                className="product-price">{formatVnd(product.priceVnd)}</strong>{hasDiscount &&
                <span className="product-saving">Tiết kiệm {saving}%</span>}</div>
            {hasDiscount && <del className="product-original-price">{formatVnd(original!)}</del>}
            <div className="product-card-actions"><Button variant="secondary" onClick={onOpen}><Icon name="visibility"/>Chi
                tiết & Biên bản</Button><Button onClick={() => addToCart(product.id)}
                                                aria-label={`${cart.includes(product.id) ? 'Đã chọn' : 'Chọn mua'} ${product.title}`}><Icon
                name={cart.includes(product.id) ? 'check' : 'shopping_bag'}/>{cart.includes(product.id) ? 'Đã chọn' : 'Chọn mua'}
            </Button></div>
        </div>
    </article>;
}

export function ProductMedia({product, index = 0}: { product: Product; index?: number }) {
    const path = product.images?.[index];
    const [failedPath, setFailedPath] = useState<string | undefined>();
    if (!path || !/^\/api\/public\/product-media\/[a-f0-9-]{36}$/i.test(path)) return <EquipmentIllustration
        type={product.deviceType}/>;
    if (failedPath === path) return <span className="product-media-fallback"><EquipmentIllustration
        type={product.deviceType}/><span>Ảnh chưa tải được</span></span>;
    return <img className="actual-product-image" src={path} alt={product.title} loading="lazy"
                onError={() => setFailedPath(path)}/>;
}

export function Modal({open, onClose, title, children}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [open]);
    return <dialog ref={ref} className="modal" aria-labelledby={titleId} onCancel={(event) => {
        event.preventDefault();
        onClose();
    }} onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
    }}>
        <div className="modal-inner">
            <div className="modal-header"><h2 id={titleId}>{title}</h2>
                <button className="icon-button" aria-label="Đóng hộp thoại" onClick={onClose}><Icon name="close"/>
                </button>
            </div>
            {children}</div>
    </dialog>;
}
