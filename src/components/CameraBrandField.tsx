import {useId, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {brandSelectionFor} from '../lib/cameraBrands';
import {fetchBrands} from '../lib/marketplace';
import {Input} from './ui';
import {errorMessage} from '../lib/apiResponse';

export function CameraBrandField({initialBrand = ''}: { initialBrand?: string }) {
    const brands = useQuery({queryKey: ['brands'], queryFn: fetchBrands});
    const names = brands.data?.map(brand => brand.name).filter(name => name !== 'Khác') ?? [];
    const initial = brandSelectionFor(initialBrand, names);
    const [selected, setSelected] = useState<string | null>(null);
    const [custom, setCustom] = useState<string | null>(null);
    const brandName = selected ?? initial.brandName;
    const customName = custom ?? initial.customBrandName;
    const id = useId();
    return <div>
        <label className="form-label" htmlFor={id}>Hãng máy <span className="required-mark">*</span>
            <select id={id} name="brandName" required value={brandName} disabled={!brands.isSuccess}
                    aria-describedby={`${id}-help`}
                    onChange={event => {
                        setSelected(event.target.value);
                    }}>
                <option value="">{brands.isPending ? 'Đang tải hãng máy…' : 'Chọn hãng máy'}</option>
                {[...names, 'Khác'].map(brand => <option key={brand} value={brand}>{brand}</option>)}
            </select>
            <small id={`${id}-help`}>Chọn “Khác” nếu hãng của bạn chưa có trong danh sách.</small>
        </label>
        {brands.isError && <p className="account-error" role="alert">{errorMessage(brands.error)} <button type="button"
                                                                                                     onClick={() => void brands.refetch()}>Thử
            lại</button></p>}
        {brands.isSuccess && brandName === 'Khác' &&
            <Input label="Tên hãng máy khác *" name="customBrandName" value={customName} required maxLength={100}
                   pattern={'.*\\S.*'}
                   placeholder="Nhập tên hãng máy" onChange={event => {
                setCustom(event.target.value);
            }}/>}
    </div>;
}
