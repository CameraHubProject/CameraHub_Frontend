import {useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {fetchFeaturedProducts} from '../lib/catalog';
import {budgets, filterCatalog, parseCatalogFilters, serializeCatalogFilters} from '../lib/catalogFilters';
import type {CatalogFilters} from '../lib/catalogFilters';
import {SiteFooter, SiteHeader} from './SiteLayout';
import {Button, EmptyState, Icon, ProductCard, Skeleton} from './ui';
import {purposes} from '../lib/marketplace';

const equipmentTypes = [['BODY', 'Thân máy ảnh'], ['LENS', 'Ống kính'], ['OTHER', 'Phụ kiện & thiết bị khác']];
const inspectionOptions = [['', 'Tất cả trạng thái'], ['NOT_INSPECTED', 'Chưa kiểm định'], ['CERTIFIED', 'Có huy hiệu kiểm định'], ['NOT_CERTIFIED', 'Chưa đạt chứng nhận'], ['EXPIRED', 'Huy hiệu đã hết hạn']];

export function CatalogPage() {
    const [params, setParams] = useSearchParams();
    const filters = parseCatalogFilters(params);
    const [draftQuery, setDraftQuery] = useState(filters.query);
    const [mobileFilters, setMobileFilters] = useState(false);
    const navigate = useNavigate();
    const catalog = useQuery({
        queryKey: ['featured-products'],
        queryFn: fetchFeaturedProducts,
        retry: 1,
        staleTime: 30_000
    });
    useEffect(() => {
        setDraftQuery(filters.query);
    }, [filters.query]);
    const allProducts = catalog.data ?? [];
    const products = filterCatalog(allProducts, filters);
    const brands = [...new Set(allProducts.map(item => item.brand))].sort((a, b) => a.localeCompare(b));
    const activeCount = filters.brands.length + filters.types.length + filters.purposes.length + Number(!!filters.budget) + Number(!!filters.inspection) + Number(!!filters.shutter);
    const pages = Math.max(1, Math.ceil(products.length / 9));
    const page = Math.max(1, Math.min(pages, Number(params.get('page')) || 1));
    const visibleProducts = products.slice((page - 1) * 9, page * 9);

    function changePage(next: number) {
        const updated = new URLSearchParams(params);
        updated.set('page', String(next));
        setParams(updated);
        document.getElementById('noi-dung')?.scrollIntoView({behavior: 'smooth'});
    }

    function update(next: Partial<CatalogFilters>) {
        setParams(serializeCatalogFilters({...filters, ...next}));
    }

    function reset() {
        setParams(new URLSearchParams());
        setDraftQuery('');
    }

    function toggle(key: 'brands' | 'types' | 'purposes', value: string) {
        update({[key]: filters[key].includes(value) ? filters[key].filter(item => item !== value) : [...filters[key], value]});
    }

    return <><SiteHeader/>
        <main className="catalog-page container" id="noi-dung">
            <section className="catalog-intro"><span className="catalog-eyebrow"><Icon name="verified"/>Kho máy tuyển chọn CameraHub</span>
                <h1>Kho Máy Ảnh — Lựa Chọn Dễ Dàng<br className="desktop-break"/> Theo Nhu Cầu</h1><p>Tìm một thiết bị
                    phù hợp với góc nhìn của bạn. Đọc rõ tình trạng người bán cung cấp và xem thông tin kiểm định trước
                    khi quyết định.</p>
                <form className="catalog-search" role="search" onSubmit={event => {
                    event.preventDefault();
                    update({query: draftQuery});
                }}><label className="catalog-search-input"><span className="sr-only">Tìm kiếm thiết bị</span><Icon
                    name="search"/><input placeholder="Tìm theo model máy (vd: EOS R6, a6400, X-T30, Z6…)"
                                          value={draftQuery}
                                          onChange={event => setDraftQuery(event.target.value)}/></label><Button
                    type="submit"><Icon name="search"/>Tìm kiếm</Button><Button type="button" variant="secondary"
                                                                                onClick={reset}><Icon
                    name="restart_alt"/>Đặt lại</Button></form>
                <div className="catalog-quick-filters"><span>GỢI Ý LỌC NHANH:</span>{purposes.map(([value, label]) =>
                    <button key={value} className={filters.purposes.includes(value) ? 'selected' : ''}
                            aria-pressed={filters.purposes.includes(value)}
                            onClick={() => toggle('purposes', value)}>{label}</button>)}
                    <button onClick={reset}>Tất cả thiết bị</button>
                </div>
            </section>
            <button className="catalog-mobile-filter button button-secondary" aria-expanded={mobileFilters}
                    aria-controls="catalog-filters" onClick={() => setMobileFilters(!mobileFilters)}><Icon name="tune"/>Bộ
                lọc chuyên sâu{activeCount > 0 && <span className="filter-count">{activeCount}</span>}<Icon
                    name={mobileFilters ? 'expand_less' : 'expand_more'}/></button>
            <div className="catalog-layout">
                <aside id="catalog-filters" className={`catalog-filters ${mobileFilters ? 'is-open' : ''}`}>
                    <div className="catalog-filter-heading"><h2><Icon name="tune"/>Bộ lọc chuyên sâu</h2>
                        <button onClick={reset}>Xóa tất cả</button>
                    </div>
                    <fieldset>
                        <legend>1. NHU CẦU SỬ DỤNG</legend>
                        {purposes.map(([value, label]) => <label className="catalog-choice" key={value}><input
                            type="checkbox" checked={filters.purposes.includes(value)}
                            onChange={() => toggle('purposes', value)}/><span>{label}</span><small>({allProducts.filter(item => item.presentation?.purposes?.includes(value)).length})</small></label>)}
                    </fieldset>
                    <fieldset>
                        <legend>LOẠI THIẾT BỊ</legend>
                        {equipmentTypes.map(([value, label]) => <label className="catalog-choice" key={value}><input
                            type="checkbox" checked={filters.types.includes(value)}
                            onChange={() => toggle('types', value)}/><span>{label}</span><small>({allProducts.filter(item => item.deviceType === value).length})</small></label>)}
                    </fieldset>
                    <fieldset>
                        <legend>2. HÃNG SẢN XUẤT</legend>
                        {catalog.isPending && <p>Đang tải thương hiệu…</p>}
                        <div className="brand-choices">{brands.map(brand => <label className="catalog-choice"
                                                                                   key={brand}><input type="checkbox"
                                                                                                      checked={filters.brands.includes(brand)}
                                                                                                      onChange={() => toggle('brands', brand)}/><span>{brand}</span></label>)}</div>
                    </fieldset>
                    <fieldset>
                        <legend>3. PHÂN KHÚC NGÂN SÁCH</legend>
                        {budgets.map(([value, label]) => <label className="catalog-choice" key={value}><input
                            type="radio" name="budget" checked={filters.budget === value}
                            onChange={() => update({budget: value})}/><span>{label}</span></label>)}</fieldset>
                    <fieldset>
                        <legend>4. TRẠNG THÁI KIỂM ĐỊNH</legend>
                        {inspectionOptions.map(([value, label]) => <label className="catalog-choice" key={value}><input
                            type="radio" name="inspection" checked={filters.inspection === value}
                            onChange={() => update({inspection: value})}/><span>{label}</span></label>)}</fieldset>
                    <fieldset>
                        <legend>5. SỐ LẦN CHỤP</legend>
                        {[['', 'Tất cả thiết bị'], ['5000', 'Dưới 5.000 lần chụp'], ['15000', 'Dưới 15.000 lần chụp']].map(([value, label]) =>
                            <label className="catalog-choice" key={value}><input type="radio" name="shutter"
                                                                                 checked={filters.shutter === value}
                                                                                 onChange={() => update({shutter: value})}/><span>{label}</span></label>)}
                    </fieldset>
                    <div className="catalog-filter-note"><Icon name="info"/><p>Huy hiệu chỉ hiển thị khi thiết bị có
                        trạng thái kiểm định tương ứng. Thông tin tình trạng cần được đối chiếu trước khi mua.</p></div>
                    <Button className="catalog-apply-mobile" onClick={() => setMobileFilters(false)}>Xem kết quả<Icon
                        name="arrow_forward"/></Button>
                </aside>
                <section className="catalog-results" aria-label="Kết quả tìm kiếm">
                    <div className="catalog-results-bar">
                        <div><strong>{catalog.isSuccess ? <>Tìm thấy <span>{products.length}</span> thiết bị phù
                            hợp</> : catalog.isError ? 'Chưa tải được thiết bị' : 'Đang tìm thiết bị…'}</strong><small>Các
                            tin đăng mới nhất đang bán</small></div>
                        <label><span>Sắp xếp:</span><select aria-label="Sắp xếp sản phẩm" value={filters.sort}
                                                            onChange={event => update({sort: event.target.value})}>
                            <option value="newest">Mới đăng nhất</option>
                            <option value="price-asc">Giá thấp đến cao</option>
                            <option value="price-desc">Giá cao đến thấp</option>
                            <option value="shutter-asc">Số lần chụp thấp nhất</option>
                        </select></label></div>
                    {(activeCount > 0 || filters.query) &&
                        <div className="catalog-selected"><span><Icon name="filter_alt"/>Đang lọc{filters.query && <>:
                            “{filters.query}”</>}</span>{filters.brands.map(brand => <button key={brand}
                                                                                             onClick={() => toggle('brands', brand)}>{brand}<Icon
                            name="close"/></button>)}{filters.types.map(type => <button key={type}
                                                                                        onClick={() => toggle('types', type)}>{equipmentTypes.find(([value]) => value === type)?.[1]}<Icon
                            name="close"/></button>)}{filters.budget && <button
                            onClick={() => update({budget: ''})}>{budgets.find(([value]) => value === filters.budget)?.[1]}<Icon
                            name="close"/></button>}{filters.inspection && <button
                            onClick={() => update({inspection: ''})}>{inspectionOptions.find(([value]) => value === filters.inspection)?.[1]}<Icon
                            name="close"/></button>}{filters.shutter && <button
                            onClick={() => update({shutter: ''})}>Dưới {Number(filters.shutter).toLocaleString('vi-VN')} lần
                            chụp<Icon name="close"/></button>}</div>}
                    <div aria-live="polite" aria-busy={catalog.isPending}>{catalog.isPending &&
                        <div className="catalog-product-grid">{[0, 1, 2, 3, 4, 5].map(key => <Skeleton
                            key={key}/>)}</div>}{catalog.isError &&
                        <EmptyState icon="wifi_off" title="Chưa tải được tin đăng"
                                    description="Vui lòng kiểm tra kết nối và thử lại."
                                    action={<Button variant="secondary" onClick={() => void catalog.refetch()}>Thử
                                        lại</Button>}/>}{catalog.isSuccess && products.length === 0 &&
                        <EmptyState icon="search_off" title="Chưa tìm thấy thiết bị phù hợp"
                                    description="Thử đổi từ khóa, mở rộng ngân sách hoặc bỏ bớt bộ lọc."
                                    action={<Button variant="secondary" onClick={reset}>Xóa bộ
                                        lọc</Button>}/>}{catalog.isSuccess && products.length > 0 &&
                        <div className="catalog-product-grid">{visibleProducts.map(product => <ProductCard
                            key={product.id} product={product}
                            onOpen={() => navigate(`/may-anh/${product.id}`)}/>)}</div>}</div>
                    {catalog.isSuccess && pages > 1 &&
                        <nav className="catalog-pagination" aria-label="Phân trang thiết bị">
                            <span>Trang {page} / {pages}</span>
                            <button disabled={page === 1} aria-label="Trang trước"
                                    onClick={() => changePage(page - 1)}>←
                            </button>
                            {Array.from({length: pages}, (_, index) => index + 1).filter(value => value === 1 || value === pages || Math.abs(value - page) < 2).map(value =>
                                <button key={value} className={page === value ? 'active' : ''}
                                        aria-current={page === value ? 'page' : undefined}
                                        onClick={() => changePage(value)}>{value}</button>)}
                            <button disabled={page === pages} aria-label="Trang sau"
                                    onClick={() => changePage(page + 1)}>→
                            </button>
                        </nav>}{catalog.isSuccess &&
                    <p className="catalog-result-note">Giá và tình trạng được cung cấp bởi người bán.</p>}
                </section>
            </div>
        </main>
        <SiteFooter/></>;
}
