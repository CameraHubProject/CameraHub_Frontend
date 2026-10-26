import {errorMessage} from '../lib/apiResponse';
import {useState} from 'react';
import type {FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {currentAccount} from '../lib/identity';
import {request, requestResult} from '../lib/marketplace';
import type {Brand} from '../lib/marketplace';
import {MarketplaceLayout, SessionGate} from './MarketplaceLayout';
import {Button, EmptyState, Icon, Input, Modal} from './ui';
import './brand-admin.css';

interface ManagedBrand extends Brand {
    modelCount: number;
    productCount: number
}

export function BrandAdminPage() {
    return <MarketplaceLayout eyebrow="Quản trị CameraHub" title="Quản lý hãng máy"
                              description="Cập nhật danh mục hãng dùng trong các tin đăng thiết bị."><SessionGate><BrandManager/></SessionGate></MarketplaceLayout>;
}

function BrandManager() {
    const session = useQuery({queryKey: ['session'], queryFn: currentAccount});
    const allowed = session.data?.roles.includes('ADMIN') ?? false;
    const brands = useQuery({
        queryKey: ['admin-brands', session.data?.id],
        queryFn: () => request<ManagedBrand[]>('/api/admin/brands'),
        enabled: allowed
    });
    const client = useQueryClient();
    const [search, setSearch] = useState('');
    const [name, setName] = useState('');
    const [action, setAction] = useState<{ type: 'edit' | 'delete'; brand: ManagedBrand } | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [editName, setEditName] = useState('');
    const rows = brands.data?.filter(brand => brand.name.toLocaleLowerCase('vi-VN').includes(search.trim().toLocaleLowerCase('vi-VN'))) ?? [];

    async function save(event: FormEvent<HTMLFormElement>, editing = false) {
        event.preventDefault();
        if (busy || (editing && !action)) return;
        const newName = (editing ? editName : name).trim().replace(/\s+/g, ' ');
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const result = await requestResult(editing ? `/api/admin/brands/${action!.brand.id}` : '/api/admin/brands', {name: newName});
            await refresh();
            setNotice(result.message);
            if (editing) setAction(null); else setName('');
        } catch (exception) {
            setError(errorMessage(exception));
        } finally {
            setBusy(false);
        }
    }

    async function remove() {
        if (!action || busy) return;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const result = await requestResult(`/api/admin/brands/${action.brand.id}/delete`, {});
            await refresh();
            setAction(null);
            setNotice(result.message);
        } catch (exception) {
            setError(errorMessage(exception));
        } finally {
            setBusy(false);
        }
    }

    function refresh() {
        return Promise.all([
            client.invalidateQueries({queryKey: ['admin-brands']}), client.invalidateQueries({queryKey: ['brands']}),
            client.invalidateQueries({queryKey: ['featured-products']}), client.invalidateQueries({queryKey: ['product']}),
            client.invalidateQueries({queryKey: ['listings']}), client.invalidateQueries({queryKey: ['listing-reviews']}),
        ]);
    }

    function open(type: 'edit' | 'delete', brand: ManagedBrand) {
        setAction({type, brand});
        setEditName(brand.name);
        setError('');
        setNotice('');
    }

    if (!allowed) return <p role="alert">Bạn chưa có quyền quản trị.</p>;

    return <>
        <nav className="account-nav brand-admin-nav" aria-label="Quản trị CameraHub"><Link to="/quan-tri/tin-dang">Duyệt
            tin đăng</Link><Link to="/quan-tri/hang-may" aria-current="page">Hãng máy</Link><Link to="/tai-khoan">Về tài
            khoản</Link></nav>
        {notice && <p className="account-notice" role="status">{notice}</p>}
        <div className="brand-admin-layout">
            <section className="surface-card brand-admin-list">
                <div className="brand-admin-heading">
                    <div><h2>Danh sách hãng máy</h2>
                        <p>{brands.data ? `${brands.data.length} hãng trong danh mục` : 'Danh mục CameraHub'}</p></div>
                    <span className="brand-admin-emblem"><Icon name="photo_camera"/></span></div>
                <Input label="Tìm hãng máy" type="search" icon="search" placeholder="Nhập tên hãng…" value={search}
                       onChange={event => setSearch(event.target.value)}/>
                {brands.isPending && <p role="status">Đang tải hãng máy…</p>}
                {brands.isError &&
                    <p className="account-error" role="alert">Chưa tải được danh sách. <button type="button"
                                                                                               onClick={() => void brands.refetch()}>Thử
                        lại</button></p>}
                {brands.isSuccess && !rows.length && <EmptyState icon="search_off" title="Chưa có hãng phù hợp"
                                                                 description={search ? 'Thử tìm bằng tên khác.' : 'Thêm hãng máy đầu tiên bằng biểu mẫu bên cạnh.'}/>}
                <ul className="brand-admin-rows" aria-label="Danh sách hãng máy">{rows.map(brand => <li key={brand.id}>
                    <div className="brand-admin-name"><strong>{brand.name}</strong><small>{brand.modelCount} dòng máy
                        · {brand.productCount} sản phẩm</small></div>
                    <div className="brand-admin-actions">
                        <button type="button" className="button button-secondary" disabled={busy}
                                aria-label={`Sửa hãng ${brand.name}`} onClick={() => open('edit', brand)}><Icon
                            name="edit"/>Sửa
                        </button>
                        <button type="button" className="button button-secondary"
                                disabled={busy || brand.modelCount > 0}
                                title={brand.modelCount > 0 ? 'Hãng đang được sử dụng, không thể xóa.' : `Xóa ${brand.name}`}
                                aria-label={`Xóa hãng ${brand.name}`} onClick={() => open('delete', brand)}><Icon
                            name="delete"/>Xóa
                        </button>
                    </div>
                </li>)}</ul>
            </section>
            <aside className="surface-card brand-admin-create"><span className="eyebrow">DANH MỤC THIẾT BỊ</span>
                <h2>Thêm hãng máy</h2><p>Hãng mới sẽ xuất hiện trong lựa chọn của người bán.</p>
                <form noValidate className="account-form" onSubmit={event => void save(event)}><Input label="Tên hãng máy *"
                                                                                           name="name" required
                                                                                           maxLength={100}
                                                                                           pattern={'.*\\S.*'}
                                                                                           placeholder="Nhập tên hãng máy"
                                                                                           value={name} disabled={busy}
                                                                                           onChange={event => setName(event.target.value)}/>{error && !action &&
                    <p className="account-error" role="alert">{error}</p>}<Button loading={busy}
                                                                                  disabled={!!action}><Icon name="add"/>Thêm
                    hãng máy</Button></form>
                <p className="form-help">Tên hãng tối đa 100 ký tự, không trùng hãng khác. “Khác” là lựa chọn riêng của
                    biểu mẫu. Hãng đã có dòng máy hoặc sản phẩm chỉ có thể đổi tên.</p></aside>
        </div>
        <Modal open={!!action} onClose={() => {
            if (!busy) {
                setAction(null);
                setError('');
            }
        }} title={action?.type === 'delete' ? 'Xóa hãng máy' : 'Sửa tên hãng máy'}>{action && (action.type === 'edit' ?
            <form noValidate className="account-form" onSubmit={event => void save(event, true)}><p>Đổi tên sẽ cập nhật tên hãng
                trên các sản phẩm liên quan.</p><Input label="Tên hãng máy *" required maxLength={100}
                                                       pattern={'.*\\S.*'} value={editName} disabled={busy}
                                                       onChange={event => setEditName(event.target.value)}/>{error &&
                <p className="account-error" role="alert">{error}</p>}<Button loading={busy}>Lưu tên hãng<Icon
                name="check"/></Button></form> :
            <div className="account-form"><p>Xóa hãng <strong>{action.brand.name}</strong> khỏi danh sách lựa chọn?
            </p>{error && <p className="account-error" role="alert">{error}</p>}
                <div className="brand-admin-actions"><Button variant="secondary" disabled={busy}
                                                             onClick={() => setAction(null)}>Giữ lại</Button><Button
                    loading={busy} onClick={() => void remove()}><Icon name="delete"/>Xóa hãng máy</Button></div>
            </div>)}</Modal>
    </>;
}
