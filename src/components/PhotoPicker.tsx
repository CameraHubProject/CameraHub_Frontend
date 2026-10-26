import {useId} from 'react';
import type {ListingPhoto} from '../lib/listingPhotos';
import {Icon} from './ui';

export function PhotoPicker({photos, onAdd, onRemove, busy, error}: {
    photos: ListingPhoto[]; onAdd: (files: File[]) => void; onRemove: (key: string) => void;
    busy: boolean; error: string;
}) {
    const inputId = useId();
    const helpId = useId();
    const labels = {
        ready: 'Sẵn sàng tải lên',
        uploading: 'Đang tải ảnh…',
        uploaded: 'Đã lưu ảnh',
        error: 'Chưa tải được ảnh'
    };
    return <div className="listing-photo-picker">
        <div className="photo-picker-heading"><p>Ảnh rõ nét giúp người mua hiểu thiết bị của bạn hơn.</p>
            <span>{photos.length}/8 ảnh</span></div>
        <label className={`photo-dropzone ${busy ? 'is-disabled' : ''}`} htmlFor={inputId}>
            <span className="photo-dropzone-icon"><Icon name="add_photo_alternate"/></span>
            <strong>{photos.length ? 'Thêm ảnh thiết bị' : 'Chọn ảnh thiết bị'}</strong>
            <span id={helpId}>JPG, PNG · Mỗi ảnh tối đa 5 MB, 24 megapixel · Tối đa 8 ảnh</span>
            <span className="photo-select-label"><Icon name="add"/>Chọn ảnh từ thiết bị</span>
            <input id={inputId} aria-label="Chọn ảnh thiết bị" aria-describedby={helpId} type="file"
                   accept="image/jpeg,image/png"
                   multiple disabled={busy || photos.length >= 8} onChange={event => {
                onAdd(Array.from(event.currentTarget.files ?? []));
                event.currentTarget.value = '';
            }}/>
        </label>
        {error && <p className="account-error" role="alert">{error}</p>}
        {photos.length > 0 &&
            <ul className="selected-photo-grid" aria-label="Ảnh thiết bị đã chọn">{photos.map((photo, index) => <li
                key={photo.key} className={`selected-photo photo-${photo.status}`}>
                <div className="selected-photo-image"><img src={photo.previewUrl}
                                                           alt={`Ảnh ${index + 1}: ${photo.file.name}`}/>
                    {index === 0 && <span className="cover-photo-label">Ảnh bìa</span>}
                    <button type="button" className="photo-remove" aria-label={`Bỏ ảnh ${photo.file.name}`}
                            disabled={busy || photo.status === 'uploaded'} onClick={() => onRemove(photo.key)}><Icon
                        name="close"/></button>
                </div>
                <div className="selected-photo-caption"><strong title={photo.file.name}>{photo.file.name}</strong><span
                    className="photo-upload-state" role="status"><Icon
                    name={photo.status === 'uploaded' ? 'check_circle' : photo.status === 'error' ? 'error' : photo.status === 'uploading' ? 'progress_activity' : 'image'}/>{labels[photo.status]}</span>{photo.error &&
                    <p>{photo.error}</p>}</div>
            </li>)}</ul>}
    </div>;
}
