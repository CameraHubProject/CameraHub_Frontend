import {errorMessage} from '../lib/apiResponse';
import {useEffect, useRef, useState} from 'react';
import type {FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {request, requestResult} from '../lib/marketplace';
import type {Product} from '../lib/products';
import {uploadListingPhoto, validatePhotoSelection} from '../lib/listingPhotos';
import type {ListingPhoto} from '../lib/listingPhotos';
import {CameraBrandField} from './CameraBrandField';
import {PhotoPicker} from './PhotoPicker';
import {Button, Input} from './ui';
import {deviceTypes, deviceTypeLabels} from '../lib/deviceTypes';
import {listingDraftModel} from '../lib/listingDraftModel';

interface Draft extends Product {
    modelId: string;
    serialNumber: string | null;
    media: { id: string; url: string }[]
}

export function ListingDraftEditor({id}: { id: string }) {
    const draft = useQuery({
        queryKey: ['listing-draft', id],
        queryFn: () => request<Draft>(`/api/marketplace/listings/${id}/draft`),
        retry: false
    });
    if (draft.isPending) return <p role="status">Đang tải bản nháp…</p>;
    if (draft.isError) return <p role="alert" className="account-error">{draft.error.message}</p>;
    return <DraftForm key={id} draft={draft.data}/>;
}

function DraftForm({draft}: { draft: Draft }) {
    const client = useQueryClient();
    const navigate = useNavigate();
    const [media, setMedia] = useState(draft.media);
    const [photos, setPhotos] = useState<ListingPhoto[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const urls = useRef(new Set<string>());
    useEffect(() => {
        setMedia(draft.media);
        setPhotos(current => current.filter(photo => photo.status !== 'uploaded'));
    }, [draft.media]);
    useEffect(() => {
        const owned = urls.current;
        return () => owned.forEach(url => URL.revokeObjectURL(url));
    }, []);

    function add(files: File[]) {
        const invalid = validatePhotoSelection(media.length + photos.length, files);
        if (invalid) {
            setError(invalid);
            return;
        }
        setPhotos(current => [...current, ...files.map(file => {
            const previewUrl = URL.createObjectURL(file);
            urls.current.add(previewUrl);
            return {key: crypto.randomUUID(), file, previewUrl, status: 'ready' as const};
        })]);
    }

    async function remove(id: string) {
        setBusy(true);
        setError('');
        try {
            await request(`/api/marketplace/listings/${draft.id}/media/${id}/remove`, {});
            setMedia(current => current.filter(image => image.id !== id));
        } catch (exception) {
            setError(errorMessage(exception));
        } finally {
            setBusy(false);
        }
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError('');
        try {
            await request(`/api/marketplace/listings/${draft.id}/draft`, {
                ...listingDraftModel(data, draft),
                deviceType: data.get('deviceType'),
                title: data.get('title'),
                priceVnd: data.get('priceVnd'),
                shutterCount: data.get('shutterCount') ? Number(data.get('shutterCount')) : null,
                description: data.get('description'),
                conditionNotes: data.get('conditionNotes'),
                accessories: data.get('accessories'),
                serialNumber: data.get('serialNumber'),
                purposes: draft.presentation?.purposes ?? [],
            });
            for (const photo of photos.filter(item => item.status !== 'uploaded')) {
                await uploadListingPhoto(draft.id, photo.file);
                setPhotos(current => current.map(item => item.key === photo.key ? {
                    ...item,
                    status: 'uploaded'
                } : item));
            }
            const submitted = await requestResult(`/api/marketplace/listings/${draft.id}/submit`, {});
            await client.invalidateQueries({queryKey: ['listings']});
            navigate('/tai-khoan?tab=listings', {state: {notice: submitted.message}});
        } catch (exception) {
            setError(errorMessage(exception));
        } finally {
            setBusy(false);
            await client.invalidateQueries({queryKey: ['listing-draft', draft.id]});
        }
    }

    return <form noValidate className="surface-card account-form" onSubmit={submit} aria-busy={busy}>
        <h2>Chỉnh sửa và gửi lại tin</h2>
        {draft.moderationNote && <p className="account-notice">{draft.moderationNote}</p>}
        <fieldset disabled={busy} style={{border: 0, padding: 0, margin: 0, display: 'grid', gap: 16, minWidth: 0}}>
            <legend className="sr-only">Thông tin bản nháp</legend>
            <CameraBrandField initialBrand={draft.brand}/>
            <label>Loại thiết bị<select name="deviceType" defaultValue={draft.deviceType}>
                {deviceTypes.map(type => <option key={type} value={type}>{deviceTypeLabels[type]}</option>)}
            </select></label>
            <Input label="Tiêu đề" name="title" required maxLength={240} defaultValue={draft.title}/>
            <Input label="Giá bán (₫)" name="priceVnd" type="number" required min="1" max="9999999999999"
                   defaultValue={draft.priceVnd}/>
            <Input label="Số lần chụp" name="shutterCount" type="number" min="0" max="2147483647"
                   defaultValue={draft.shutterCount ?? ''}/>
            <label>Mô tả<textarea name="description" required rows={5} maxLength={10000}
                                  defaultValue={draft.description}/></label>
            <label>Tình trạng<textarea name="conditionNotes" required rows={3} maxLength={4000}
                                       defaultValue={draft.conditionNotes}/></label>
            <Input label="Phụ kiện" name="accessories" maxLength={2000} defaultValue={draft.accessories ?? ''}/>
            <Input label="Số sê-ri (riêng tư)" name="serialNumber" maxLength={200}
                   defaultValue={draft.serialNumber ?? ''}/>
            <p>Đã lưu {media.length}/8 ảnh. Xóa ảnh trùng trước khi gửi lại tin.</p>
            <div className="review-photos">{media.map(image => <div key={image.id}><img src={image.url}
                                                                                        alt="Ảnh đã lưu của thiết bị"/><Button
                type="button" variant="secondary" onClick={() => void remove(image.id)}>Xóa ảnh</Button></div>)}</div>
            <PhotoPicker photos={photos} busy={busy} error="" onAdd={add}
                         onRemove={key => setPhotos(current => current.filter(item => item.key !== key))}/>
            <Button loading={busy}>Lưu và gửi AI duyệt</Button>
        </fieldset>
        {error && <p className="account-error" role="alert">{error}</p>}
    </form>;
}
