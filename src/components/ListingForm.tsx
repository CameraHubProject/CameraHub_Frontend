import {errorMessage} from '../lib/apiResponse';
import {useEffect, useRef, useState} from 'react';
import type {FormEvent} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {purposes, request, requestResult} from '../lib/marketplace';
import type {Brand} from '../lib/marketplace';
import {cameraBrandPayload} from '../lib/cameraBrands';
import {CameraBrandField} from './CameraBrandField';
import {uploadListingPhoto, validatePhotoSelection} from '../lib/listingPhotos';
import type {ListingPhoto} from '../lib/listingPhotos';
import {Button, Icon, Input} from './ui';
import {PhotoPicker} from './PhotoPicker';
import {ListingDraftEditor} from './ListingDraftEditor';
import './listing-editor.css';

export function ListingForm() {
    const [params] = useSearchParams();
    const draft = params.get('draft');
    return draft ? <ListingDraftEditor id={draft}/> : <NewListingForm/>;
}

function NewListingForm() {
    const client = useQueryClient();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [photoError, setPhotoError] = useState('');
    const [photos, setPhotos] = useState<ListingPhoto[]>([]);
    const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
    const [createdId, setCreatedId] = useState('');
    const urls = useRef(new Set<string>());
    useEffect(() => {
        const ownedUrls = urls.current;
        return () => ownedUrls.forEach(url => URL.revokeObjectURL(url));
    }, []);

    function addPhotos(files: File[]) {
        const unique = files.filter(file => !photos.some(item => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified));
        const invalid = validatePhotoSelection(photos.length, unique);
        if (invalid) {
            setPhotoError(invalid);
            return;
        }
        setPhotoError('');
        setPhotos(current => [...current, ...unique.map(file => {
            const previewUrl = URL.createObjectURL(file);
            urls.current.add(previewUrl);
            return {key: crypto.randomUUID(), file, previewUrl, status: 'ready' as const};
        })]);
    }

    function removePhoto(key: string) {
        const photo = photos.find(item => item.key === key);
        if (!photo || photo.status === 'uploaded') return;
        URL.revokeObjectURL(photo.previewUrl);
        urls.current.delete(photo.previewUrl);
        setPhotos(current => current.filter(item => item.key !== key));
        setPhotoError('');
    }

    function updatePhoto(key: string, changes: Partial<ListingPhoto>) {
        setPhotos(current => current.map(photo => photo.key === key ? {...photo, ...changes} : photo));
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setError('');
        const data = new FormData(event.currentTarget);
        try {
            let id = createdId;
            if (!id) {
                const created = await request<{ id: string }>('/api/marketplace/listings', {
                    ...cameraBrandPayload(data, client.getQueryData<Brand[]>(['brands'])?.map(brand => brand.name) ?? []),
                    deviceType: data.get('deviceType'),
                    title: data.get('title'),
                    priceVnd: data.get('priceVnd'),
                    shutterCount: data.get('shutterCount') ? Number(data.get('shutterCount')) : null,
                    description: data.get('description'),
                    conditionNotes: data.get('conditionNotes'),
                    accessories: data.get('accessories'),
                    serialNumber: data.get('serialNumber'),
                    purposes: selectedPurposes,
                });
                id = created.id;
                setCreatedId(id);
            }
            let failures = 0;
            for (const photo of photos.filter(item => item.status !== 'uploaded')) {
                updatePhoto(photo.key, {status: 'uploading', error: undefined});
                try {
                    await uploadListingPhoto(id, photo.file);
                    updatePhoto(photo.key, {status: 'uploaded'});
                } catch (exception) {
                    failures++;
                    updatePhoto(photo.key, {
                        status: 'error',
                        error: errorMessage(exception)
                    });
                }
            }
            await client.invalidateQueries({queryKey: ['listings']});
            if (failures) {
                setError(`Tin đăng đã được tạo, còn ${failures} ảnh chưa tải được. Bạn có thể thử lại hoặc bỏ ảnh lỗi; các ảnh đã lưu được giữ nguyên.`);
            } else {
                const submitted = await requestResult(`/api/marketplace/listings/${id}/submit`, {});
                await client.invalidateQueries({queryKey: ['listings']});
                navigate('/tai-khoan?tab=listings', {state: {notice: submitted.message}});
            }
        } catch (exception) {
            setError(errorMessage(exception));
        } finally {
            setBusy(false);
        }
    }

    const savedPhotos = photos.filter(photo => photo.status === 'uploaded').length;
    return <form noValidate className="seller-layout listing-editor" onSubmit={submit} aria-busy={busy}>
        <div className="listing-editor-sections">
            {createdId && <div className="listing-saved-notice" role="status"><Icon name="check_circle"/>
                <div><strong>Thông tin tin đăng đã được lưu</strong><p>Hoàn tất ảnh bên dưới để tiếp tục. Bạn sẽ không
                    tạo thêm tin khi thử tải lại.</p></div>
            </div>}
            <section className="surface-card">
                <div className="editor-section-title"><span className="section-number">01</span>
                    <div><h2>Thông tin cơ bản</h2><p>Chọn hãng máy; ghi dòng máy hoặc tên thiết bị trong tiêu đề.</p>
                    </div>
                </div>
                <fieldset className="listing-fields" disabled={busy || !!createdId}>
                    <legend className="sr-only">Thông tin thiết bị</legend>
                    <div className="form-grid"><CameraBrandField/>
                        <label className="form-label">Loại thiết bị<select name="deviceType" defaultValue="BODY">
                            <option value="BODY">Thân máy ảnh</option>
                            <option value="LENS">Ống kính</option>
                            <option value="OTHER">Phụ kiện & thiết bị khác</option>
                        </select></label>
                    </div>
                    <Input label="Tiêu đề tin đăng *" name="title"
                           placeholder="Ví dụ: Canon EOS R6 — thân máy, ngoại hình đẹp" maxLength={240} required/>
                    <div className="form-grid"><Input label="Giá bán mong muốn (₫) *" name="priceVnd" type="number"
                                                      inputMode="numeric" min="1" max="9999999999999" step="1" required
                                                      placeholder="24500000"/><Input label="Số lần chụp (nếu biết)"
                                                                                     name="shutterCount" type="number"
                                                                                     inputMode="numeric" min="0"
                                                                                     max="2147483647" step="1"
                                                                                     placeholder="8500"/></div>
                    <label className="form-label">Mô tả thiết bị <span className="required-mark">*</span><textarea
                        name="description" rows={5} required maxLength={10000}
                        placeholder="Thời gian sử dụng, điểm nổi bật và lý do bạn muốn nhượng lại…"/></label>
                    <p className="form-label">Thiết bị phù hợp với nhu cầu</p>
                    <div className="purpose-options">{purposes.map(([value, label, icon]) => <label key={value}
                                                                                                    className={selectedPurposes.includes(value) ? 'selected' : ''}><input
                        type="checkbox" checked={selectedPurposes.includes(value)}
                        onChange={() => setSelectedPurposes(current => current.includes(value) ? current.filter(key => key !== value) : [...current, value])}/><Icon
                        name={icon}/>{label}</label>)}</div>
                </fieldset>
            </section>
            <section className="surface-card">
                <div className="editor-section-title"><span className="section-number">02</span>
                    <div><h2>Tình trạng & phụ kiện</h2><p>Thông tin đầy đủ giúp người mua yên tâm hơn.</p></div>
                </div>
                <fieldset className="listing-fields" disabled={busy || !!createdId}>
                    <legend className="sr-only">Tình trạng và phụ kiện</legend>
                    <label className="form-label">Tình trạng thực tế <span className="required-mark">*</span><textarea
                        name="conditionNotes" rows={4} required maxLength={4000}
                        placeholder="Ngoại hình, cảm biến, ống kính và những điểm cần lưu ý…"/></label><Input
                    label="Phụ kiện đi kèm" name="accessories" maxLength={2000}
                    placeholder="Pin, sạc, dây đeo, hộp…"/><Input label="Số sê-ri (được giữ riêng tư)"
                                                                  name="serialNumber" maxLength={200}
                                                                  placeholder="Số sê-ri đầy đủ của thiết bị"/>
                </fieldset>
            </section>
            <section className="surface-card" id="anh-thiet-bi">
                <div className="editor-section-title"><span className="section-number">03</span>
                    <div><h2>Hình ảnh thiết bị</h2><p>Thêm ít nhất một ảnh thực tế. Ảnh trùng với tin khác sẽ không được
                        chấp nhận.</p></div>
                </div>
                <PhotoPicker photos={photos} onAdd={addPhotos} onRemove={removePhoto} busy={busy} error={photoError}/>
            </section>
        </div>
        <aside className="surface-card seller-guide listing-submit-panel"><span
            className="eyebrow">TIN ĐĂNG MINH BẠCH</span><h2>Sẵn sàng cho hành trình mới.</h2><p>Một tin đăng rõ ràng
            giúp thiết bị tìm đúng người đồng
            hành.</p>{[['photo_camera', 'Ảnh chụp thực tế', 'Ưu tiên ảnh sáng rõ, thể hiện đủ các mặt và dấu hiệu sử dụng.'], ['fact_check', 'Mô tả trung thực', 'Ghi rõ tình trạng và những phụ kiện sẽ bàn giao.'], ['verified_user', 'Kiểm tra trước khi đăng', 'AI tự duyệt tin hợp lệ, chặn tin/ảnh trùng. Admin xử lý khi AI chưa thể quyết định.']].map(([icon, title, copy]) =>
            <div className="seller-tip" key={icon}><Icon name={icon}/><span><strong>{title}</strong><p>{copy}</p></span>
            </div>)}
            <label className="terms-check"><input type="checkbox" required defaultChecked={false}
                                                  disabled={busy || !!createdId}/><span>Tôi xác nhận thông tin và hình ảnh phản ánh đúng thiết bị.</span></label>
            {busy && <div className="listing-upload-progress" role="status">
                <span>{createdId ? `Đã lưu ${savedPhotos}/${photos.length} ảnh` : 'Đang lưu thông tin tin đăng…'}</span>
                <progress max={Math.max(photos.length, 1)} value={savedPhotos} aria-label="Tiến trình tải ảnh"/>
            </div>}
            {error && <p className="account-error" role="alert">{error}</p>}
            <Button
                loading={busy}>{busy ? 'Đang xử lý…' : createdId ? 'Hoàn tất các ảnh còn lại' : 'Gửi tin đăng để duyệt'}{!busy &&
                <Icon name="arrow_forward"/>}</Button>
            {createdId && !busy && <><Link className="text-link" to={`/dang-ban?draft=${createdId}`}>Chỉnh sửa nội dung
                và ảnh đã lưu<Icon name="edit"/></Link><Link className="text-link" to="/tai-khoan?tab=listings">Về kho
                thiết bị<Icon name="arrow_forward"/></Link></>}
        </aside>
    </form>;
}
