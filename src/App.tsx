import {useEffect, useState} from 'react';
import {Link, Route, Routes, Navigate, useLocation, useNavigate} from 'react-router-dom';
import {AuthPage} from './components/AccountPages';
import {CatalogPage} from './components/CatalogPage';
import {PublicProfilePage} from './components/PublicProfilePage';
import {ProductPage} from './components/ProductPage';
import {CartPage, CheckoutPage, OrdersPage, OrderPage} from './components/ShoppingPages';
import {AiChatWidget} from './components/AiChatWidget';
import {AdvisorPage} from './components/AdvisorPage';
import {BrandAdminPage} from './components/BrandAdminPage';
import {SellPage, BuybackPage} from './components/SellerPages';
import {ProfilePage, ListingReviewPage} from './components/ProfilePage';
import {SiteFooter, SiteHeader} from './components/SiteLayout';
import {useQuery} from '@tanstack/react-query';
import {Button, EmptyState, Icon, Input, ProductCard, Skeleton} from './components/ui';
import {fetchFeaturedProducts} from './lib/catalog';
import {filterProducts, formatVnd} from './lib/products';
import type {ProductFilters} from './lib/products';

const initialFilters: ProductFilters = {query: '', brand: '', deviceType: '', budget: ''};
const categories = [
    {
        icon: 'photo_camera',
        title: 'Thân máy ảnh',
        description: 'Tìm người bạn đồng hành cho những khung hình sắp tới.',
        type: 'BODY',
        detail: 'Lưu giữ góc nhìn của bạn'
    },
    {
        icon: 'camera',
        title: 'Ống kính tuyển chọn',
        description: 'Một tiêu cự mới. Một cách kể câu chuyện hoàn toàn khác.',
        type: 'LENS',
        detail: 'Mở rộng từng khung hình'
    },
    {
        icon: 'center_focus_strong',
        title: 'Thiết bị & phụ kiện',
        description: 'Hoàn thiện bộ thiết bị theo cách chụp của riêng bạn.',
        type: 'OTHER',
        detail: 'Sẵn sàng cho chuyến đi'
    },
    {
        icon: 'grid_view',
        title: 'Khám phá tất cả',
        description: 'Thiết bị đã qua sử dụng, thêm một hành trình đáng nhớ.',
        type: '',
        detail: 'Tìm cảm hứng tiếp theo'
    },
];
const checks = [
    {
        title: 'Ngoại quan & đối chiếu',
        icon: 'search',
        copy: 'Đối chiếu thiết bị với mô tả người bán, ghi nhận tình trạng vỏ máy, ngàm và các chi tiết bên ngoài.',
        note: 'Tình trạng được ghi nhận rõ ràng'
    },
    {
        title: 'Cảm biến & quang học',
        icon: 'filter_center_focus',
        copy: 'Kiểm tra cảm biến, bề mặt kính và những dấu hiệu có thể ảnh hưởng đến chất lượng hình ảnh.',
        note: 'Lưu lại kết quả kiểm tra'
    },
    {
        title: 'Màn trập & thao tác',
        icon: 'shutter_speed',
        copy: 'Kiểm tra hoạt động màn trập, lấy nét và các nút điều khiển theo loại thiết bị.',
        note: 'Kiểm tra theo từng hạng mục'
    },
    {
        title: 'Kết nối & báo cáo',
        icon: 'fact_check',
        copy: 'Ghi nhận kết quả kiểm tra cổng kết nối, phụ kiện và tổng hợp báo cáo kiểm định.',
        note: 'Đọc báo cáo trước khi quyết định'
    },
];

function scrollToProducts() {
    window.setTimeout(() => document.getElementById('may-anh')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    }), 0);
}

export function App() {
    return <><ScrollToLocation/><Routes><Route path="/" element={<HomePage/>}/><Route path="/may-anh"
                                                                                      element={<CatalogPage/>}/><Route
        path="/may-anh/:id" element={<ProductPage/>}/><Route path="/gio-hang" element={<CartPage/>}/><Route
        path="/thanh-toan" element={<CheckoutPage/>}/><Route path="/don-hang" element={<OrdersPage/>}/><Route
        path="/don-hang/:id" element={<OrderPage/>}/><Route path="/ai-tu-van" element={<AdvisorPage/>}/><Route
        path="/dang-ban" element={<SellPage/>}/><Route path="/thu-mua-may-cu" element={<BuybackPage/>}/><Route
        path="/dang-nhap" element={<AuthPage key="login"/>}/><Route path="/dang-ky"
                                                                    element={<AuthPage key="register" create/>}/><Route
        path="/thanh-vien/:id" element={<PublicProfilePage/>}/><Route path="/tai-khoan" element={<ProfilePage/>}/><Route
        path="/tai-khoan/xac-minh" element={<Navigate to="/tai-khoan?tab=settings" replace/>}/><Route
        path="/quan-tri/xac-minh" element={<Navigate to="/quan-tri/tin-dang" replace/>}/><Route
        path="/quan-tri/tin-dang" element={<ListingReviewPage/>}/><Route path="/quan-tri/hang-may"
                                                                         element={<BrandAdminPage/>}/><Route path="*"
                                                                                                             element={
                                                                                                                 <main
                                                                                                                     className="container account-main">
                                                                                                                     <h1>Không
                                                                                                                         tìm
                                                                                                                         thấy
                                                                                                                         trang</h1>
                                                                                                                     <Link
                                                                                                                         to="/">Về
                                                                                                                         trang
                                                                                                                         chủ</Link>
                                                                                                                 </main>}/></Routes><AiChatWidget/></>;
}

function ScrollToLocation() {
    const {pathname, hash} = useLocation();
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            if (hash) {
                let target = hash.slice(1);
                try {
                    target = decodeURIComponent(target);
                } catch { /* Use the literal hash. */
                }
                document.getElementById(target)?.scrollIntoView({block: 'start'});
            } else window.scrollTo(0, 0);
        });
        return () => cancelAnimationFrame(frame);
    }, [pathname, hash]);
    return null;
}

function HomePage() {
    const [draft, setDraft] = useState<ProductFilters>(initialFilters);
    const [filters, setFilters] = useState<ProductFilters>(initialFilters);
    const navigate = useNavigate();
    const [advisorBudget, setAdvisorBudget] = useState('10000000-20000000');
    const [advisorType, setAdvisorType] = useState('BODY');
    const catalog = useQuery({
        queryKey: ['featured-products'],
        queryFn: fetchFeaturedProducts,
        retry: 1,
        staleTime: 30_000
    });
    const products = filterProducts(catalog.data ?? [], filters);
    const hasFilters = Object.values(filters).some(Boolean);

    function applyFilters(next: ProductFilters) {
        setFilters(next);
        setDraft(next);
        scrollToProducts();
    }

    return <>
        <a className="skip-link" href="#noi-dung">Chuyển đến nội dung</a><SiteHeader/>
        <main id="noi-dung">
            <section className="hero">
                <div className="container hero-grid">
                    <div className="hero-copy">
                        <div className="hero-labels"><span className="eyebrow-chip"><span className="tiny-dot"/> Góc nhìn mới, câu chuyện tiếp nối</span><span
                            className="quiet-label">Dành cho người yêu nhiếp ảnh</span></div>
                        <h1>Chọn máy ảnh đúng.<br/>Mua máy an tâm<span className="olive-period">.</span></h1>
                        <p className="hero-description">Một chiếc máy ảnh tốt xứng đáng với hành trình tiếp theo. Khám
                            phá thiết bị đã qua sử dụng, tìm hiểu tình trạng và chọn người bạn đồng hành của riêng
                            bạn.</p>
                        <div className="hero-buttons"><Link className="button button-primary" to="/may-anh"><Icon
                            name="photo_camera"/>Khám phá máy ảnh</Link><Link className="button button-secondary"
                                                                              to="/dang-ban"><Icon name="sell"/>Bán máy
                            ảnh cũ</Link><Link className="button button-olive" to="/ai-tu-van"><Icon
                            name="auto_awesome"/>Trò chuyện với Cami</Link></div>
                        <div className="hero-facts" aria-label="Chính sách giao dịch của CameraHub">
                            <div><strong>30<span>%</span></strong><span>Đặt cọc giá thiết bị</span></div>
                            <div><strong>48<span> giờ</span></strong><span>Thời gian bảo vệ giao dịch</span></div>
                            <div><strong>{formatVnd('0')}</strong><span>Phí giao dịch marketplace</span></div>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-image-wrap"><img src="/images/hero-cameras.jpg"
                                                              alt="Hai chiếc máy ảnh trên bàn trong không gian studio ngập ánh sáng"
                                                              fetchPriority="high"/>
                            <div className="hero-image-gradient"/>
                            <div className="hero-image-caption"><span
                                className="image-kicker">THÊM MỘT HÀNH TRÌNH</span><h2>Máy cũ. Cảm hứng mới.</h2><span>Vì những khoảnh khắc còn ở phía trước.</span>
                            </div>
                        </div>
                        <div className="inspection-stamp"><span className="stamp-icon"><Icon
                            name="verified_user"/></span>
                            <div><strong>Hiểu chiếc máy. An tâm lựa chọn.</strong><span>Tìm hiểu tình trạng và báo cáo kiểm định</span>
                            </div>
                            <Icon name="north_east"/></div>
                        <span className="photo-credit">Hình ảnh minh họa cho bộ sưu tập</span></div>
                </div>
            </section>

            <section className="container search-section" id="tim-kiem" aria-label="Lọc thiết bị nổi bật">
                <form className="quick-search" onSubmit={(event) => {
                    event.preventDefault();
                    applyFilters(draft);
                }}>
                    <Input label="Tìm tên máy hoặc dòng máy" hideLabel icon="search"
                           placeholder="Bạn đang tìm chiếc máy nào?" value={draft.query}
                           onChange={(event) => setDraft({...draft, query: event.target.value})}/>
                    <label className="select-field"><span className="sr-only">Thương hiệu</span><select
                        value={draft.brand} onChange={(event) => setDraft({...draft, brand: event.target.value})}>
                        <option value="">Tất cả thương hiệu</option>
                        {['Sony', 'Fujifilm', 'Canon', 'Nikon', 'Leica', 'Panasonic', 'Olympus'].map((brand) => <option
                            key={brand}>{brand}</option>)}</select><Icon name="expand_more"/></label>
                    <label className="select-field"><span className="sr-only">Loại thiết bị</span><select
                        value={draft.deviceType}
                        onChange={(event) => setDraft({...draft, deviceType: event.target.value})}>
                        <option value="">Tất cả thiết bị</option>
                        <option value="BODY">Body</option>
                        <option value="BODY_LENS">Body + lens</option>
                        <option value="LENS">Ống kính</option>
                        <option value="OTHER">Thiết bị khác</option>
                    </select><Icon name="expand_more"/></label>
                    <label className="select-field"><span className="sr-only">Khoảng giá</span><select
                        value={draft.budget} onChange={(event) => setDraft({...draft, budget: event.target.value})}>
                        <option value="">Khoảng giá</option>
                        <option value="0-10000000">Dưới 10 triệu</option>
                        <option value="10000000-20000000">10 – 20 triệu</option>
                        <option value="20000000-35000000">20 – 35 triệu</option>
                        <option value="35000000-">Từ 35 triệu</option>
                    </select><Icon name="expand_more"/></label><Button type="submit"><Icon name="tune"/>Lọc máy
                    nhanh</Button>
                </form>
            </section>

            <section className="section container category-section" aria-labelledby="category-heading">
                <div className="section-heading">
                    <div><p className="eyebrow">MỖI NGƯỜI MỘT GÓC NHÌN</p><h2 id="category-heading">Tìm thiết bị cho câu
                        chuyện của bạn</h2></div>
                    <a className="text-link" href="#may-anh">Khám phá bộ sưu tập <Icon name="arrow_forward"/></a></div>
                <div className="category-grid">{categories.map((category) => <button key={category.title}
                                                                                     className="category-card"
                                                                                     onClick={() => applyFilters({
                                                                                         ...initialFilters,
                                                                                         deviceType: category.type
                                                                                     })}><span
                    className="category-icon"><Icon name={category.icon}/></span><h3>{category.title}</h3>
                    <p>{category.description}</p><span className="category-bottom">{category.detail}<Icon
                        name="arrow_forward"/></span></button>)}</div>
            </section>

            <section className="featured-section section" id="may-anh" aria-labelledby="featured-heading">
                <div className="container">
                    <div className="section-heading">
                        <div><span className="eyebrow-chip"><span
                            className="tiny-dot"/> Từ những tin đăng đang bán</span><h2 id="featured-heading">Thiết bị
                            nổi bật, sẵn sàng tiếp nối</h2><p className="section-description">Khám phá những tin đăng
                            mới nhất đã được duyệt. Mỗi thiết bị là một lựa chọn riêng.</p></div>
                        <div className="filter-tabs"
                             aria-label="Lọc loại thiết bị">{[['', 'Tất cả'], ['BODY', 'Body'], ['BODY_LENS', 'Body + lens'], ['LENS', 'Lens'], ['OTHER', 'Phụ kiện']].map(([value, label]) =>
                            <button key={label} className={filters.deviceType === value ? 'selected' : ''}
                                    aria-pressed={filters.deviceType === value} onClick={() => applyFilters({
                                ...filters,
                                deviceType: value
                            })}>{label}</button>)}</div>
                    </div>
                    {hasFilters && <div className="active-filters">
                        <span>{catalog.isSuccess ? `${products.length} thiết bị phù hợp` : 'Bộ lọc đã áp dụng'}{filters.query && <> với
                            “{filters.query}”</>}</span>
                        <button onClick={() => applyFilters(initialFilters)}>Xóa bộ lọc <Icon name="close"/></button>
                    </div>}
                    <div aria-live="polite" aria-busy={catalog.isPending}>
                        {catalog.isPending &&
                            <div className="product-grid">{[0, 1, 2, 3].map((key) => <Skeleton key={key}/>)}</div>}
                        {catalog.isError && <EmptyState icon="wifi_off" title="Chưa tải được tin đăng"
                                                        description="Chưa thể lấy danh sách thiết bị. Vui lòng thử lại sau hoặc kiểm tra kết nối."
                                                        action={<Button variant="secondary"
                                                                        onClick={() => void catalog.refetch()}><Icon
                                                            name="refresh"/>Thử lại</Button>}/>}
                        {catalog.isSuccess && products.length === 0 &&
                            <EmptyState icon={hasFilters ? 'search_off' : 'photo_camera'}
                                        title={hasFilters ? 'Chưa tìm thấy thiết bị phù hợp' : 'Chưa có tin đăng đang bán'}
                                        description={hasFilters ? 'Thử một từ khóa khác hoặc mở rộng khoảng giá. Chỉ các tin đăng đã được duyệt mới xuất hiện tại đây.' : 'Những thiết bị được duyệt sẽ xuất hiện tại đây. Trong lúc chờ đợi, hãy tìm hiểu cách đọc tình trạng và quy trình kiểm định.'}
                                        action={hasFilters ?
                                            <Button variant="secondary" onClick={() => applyFilters(initialFilters)}>Xóa
                                                bộ lọc</Button> :
                                            <a className="button button-secondary" href="#kiem-dinh">Tìm hiểu kiểm
                                                định <Icon name="arrow_forward"/></a>}/>}
                        {catalog.isSuccess && products.length > 0 &&
                            <div className="product-grid">{products.map((product) => <ProductCard key={product.id}
                                                                                                  product={product}
                                                                                                  onOpen={() => navigate(`/may-anh/${product.id}`)}/>)}</div>}
                    </div>
                    <div className="brands-strip" aria-label="Lọc theo thương hiệu">
                        <span>NHỮNG TÊN TUỔI QUEN THUỘC</span>
                        <div>{['SONY', 'FUJIFILM', 'Canon', 'Nikon', 'Leica'].map((brand) => <button key={brand}
                                                                                                     onClick={() => applyFilters({
                                                                                                         ...initialFilters,
                                                                                                         brand
                                                                                                     })}>{brand}</button>)}</div>
                    </div>
                </div>
            </section>

            <section className="section container" id="tu-van" aria-labelledby="advisor-heading">
                <div className="advisor-panel">
                    <div className="advisor-copy"><span className="dark-eyebrow"><Icon name="auto_awesome"/> BẮT ĐẦU TỪ ĐIỀU BẠN CẦN</span>
                        <h2 id="advisor-heading">Chiếc máy phù hợp,<br/>trong tầm tay của bạn.</h2><p>Bắt đầu bằng ngân
                            sách và loại thiết bị. CameraHub giúp bạn thu hẹp lựa chọn từ những tin đăng thực tế đang
                            bán.</p>
                        <form onSubmit={(event) => {
                            event.preventDefault();
                            navigate(`/may-anh?budget=${encodeURIComponent(advisorBudget)}&type=${advisorType}`);
                        }}>
                            <div className="advisor-fields"><label>Ngân sách của bạn<select value={advisorBudget}
                                                                                            onChange={(event) => setAdvisorBudget(event.target.value)}>
                                <option value="0-10000000">Dưới 10 triệu</option>
                                <option value="10000000-20000000">10 – 20 triệu</option>
                                <option value="20000000-35000000">20 – 35 triệu</option>
                                <option value="35000000-">Từ 35 triệu</option>
                            </select></label><label>Bạn đang tìm<select value={advisorType}
                                                                        onChange={(event) => setAdvisorType(event.target.value)}>
                                <option value="BODY">Body</option>
                                <option value="BODY_LENS">Body + lens</option>
                                <option value="LENS">Một chiếc ống kính</option>
                                <option value="OTHER">Thiết bị khác</option>
                                <option value="">Tất cả thiết bị</option>
                            </select></label></div>
                            <Button variant="light" type="submit"><Icon name="travel_explore"/>Tìm chiếc máy phù
                                hợp</Button></form>
                    </div>
                    <div className="advisor-art" aria-hidden="true"><span className="orbit orbit-one"/><span
                        className="orbit orbit-two"/>
                        <div className="camera-outline"><Icon name="photo_camera"/></div>
                        <span className="art-label label-one"><Icon name="tune"/>Đúng nhu cầu</span><span
                            className="art-label label-two"><Icon name="payments"/>Vừa ngân sách</span><span
                            className="art-label label-three"><Icon name="favorite"/>Thêm cảm hứng</span><span
                            className="art-caption">Góc nhìn của bạn. Lựa chọn của bạn.</span></div>
                </div>
            </section>

            <section className="section container inspection-section" id="kiem-dinh"
                     aria-labelledby="inspection-heading">
                <div className="section-heading">
                    <div><p className="eyebrow">HIỂU THIẾT BỊ TRƯỚC KHI CHỌN</p><h2 id="inspection-heading">An tâm bắt
                        đầu từ sự minh bạch.</h2><p className="section-description">Tìm hiểu những hạng mục trong quy
                        trình kiểm định. Kết quả từng thiết bị cần được đối chiếu với báo cáo thực tế.</p></div>
                    <span className="inspection-label"><Icon name="verified_user"/>Kiểm định độc lập</span></div>
                <div className="inspection-grid">{checks.map((check, index) => <article className="inspection-card"
                                                                                        key={check.title}>
                    <div className="check-number"><span>0{index + 1}</span><Icon name={check.icon}/></div>
                    <h3>{check.title}</h3><p>{check.copy}</p><span className="check-note"><Icon
                    name="check"/>{check.note}</span></article>)}</div>
                <details className="inspection-details">
                    <summary><span><Icon
                        name="description"/>Tôi nên đọc thông tin tình trạng thiết bị như thế nào?</span><Icon
                        name="add"/></summary>
                    <p>Đọc kỹ mô tả, số lần chụp nếu có, lịch sử sửa chữa và phụ kiện đi kèm. Đối chiếu thông tin người
                        bán với kết quả kiểm định. Chỉ tin đăng có trạng thái kiểm định phù hợp mới hiển thị huy hiệu;
                        ảnh minh họa không thay thế báo cáo thực tế.</p></details>
            </section>

            <section className="protection-section section" id="bao-ve">
                <div className="container">
                    <div className="section-heading centered">
                        <div><p className="eyebrow">MỘT CỘNG ĐỒNG. NHIỀU HÀNH TRÌNH.</p><h2>Trao thiết bị. Tiếp nối đam
                            mê.</h2><p className="section-description">CameraHub kết nối người yêu nhiếp ảnh bằng thông
                            tin rõ ràng và những lựa chọn có cơ sở.</p></div>
                    </div>
                    <div className="principle-grid">
                        <article><Icon name="visibility"/><h3>Hiểu rõ điều bạn chọn</h3><p>Tình trạng, mô tả và kết quả
                            kiểm định giúp bạn đưa ra quyết định phù hợp.</p></article>
                        <article><Icon name="verified_user"/><h3>48 giờ bảo vệ giao dịch</h3><p>Thời gian bảo vệ chỉ bắt
                            đầu khi giao thành công và người mua đã xác nhận nhận hàng.</p></article>
                        <article><Icon name="lock"/><h3>Tôn trọng sự riêng tư</h3><p>Số điện thoại, email và số sê-ri
                            đầy đủ được giữ riêng tư.</p></article>
                    </div>
                    <div className="bottom-cta">
                        <div><span className="eyebrow">MỘT KHỞI ĐẦU MỚI CHO GÓC NHÌN QUEN</span><h2>Hành trình tiếp theo<br/>bắt
                            đầu từ chiếc máy phù hợp.</h2></div>
                        <a className="button button-primary" href="#may-anh">Khám phá thiết bị <Icon
                            name="arrow_forward"/></a></div>
                </div>
            </section>
        </main>

        <SiteFooter/>

    </>;
}
