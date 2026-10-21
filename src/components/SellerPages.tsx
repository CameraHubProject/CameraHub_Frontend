import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currentAccount } from '../lib/identity';
import { fetchAddresses, fetchBuybacks, request } from '../lib/marketplace';
import type { Address } from '../lib/marketplace';
import { formatVnd } from '../lib/products';
import { MarketplaceLayout, SessionGate, TrustStrip } from './MarketplaceLayout';
import { Button, Icon, Input } from './ui';
import { ListingForm } from './ListingForm';

export function SellPage() { return <MarketplaceLayout eyebrow="Kênh người bán CameraHub" title="Trao thiết bị. Tiếp nối đam mê." description="Thông tin rõ ràng giúp chiếc máy của bạn tìm đúng người đồng hành."><SessionGate><ListingForm /></SessionGate><TrustStrip /></MarketplaceLayout>; }
export function BuybackPage() { return <MarketplaceLayout eyebrow="Thu mua máy cũ" title="Máy cũ của bạn, khởi đầu mới." description="Gửi thông tin thiết bị để CameraHub tiếp nhận yêu cầu thu mua. Giá cuối cùng cần được xác nhận sau khi kiểm tra."><SessionGate><BuybackForm /></SessionGate><TrustStrip /></MarketplaceLayout>; }
function BuybackForm() {
  const session = useQuery({ queryKey: ['session'], queryFn: currentAccount });
  const requests = useQuery({ queryKey: ['buybacks',session.data?.id], queryFn: fetchBuybacks });
  const [busy,setBusy] = useState(false); const [notice,setNotice] = useState(''); const [error,setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setError(''); setNotice('');
    try { await request('/api/marketplace/buyback', { model: data.get('model'), conditionNotes: data.get('conditionNotes'), expectedPriceVnd: data.get('expectedPriceVnd') }); form.reset(); setNotice('Đã tiếp nhận yêu cầu. Bạn có thể theo dõi trạng thái bên dưới.'); await requests.refetch(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : 'Chưa gửi được yêu cầu.'); } finally { setBusy(false); }
  }
  return <><div className="seller-layout"><form className="surface-card account-form" onSubmit={submit}><h2>Thiết bị bạn muốn chuyển nhượng</h2><Input label="Hãng & model" name="model" required maxLength={160} placeholder="Ví dụ: Fujifilm X-T30 II" /><Input label="Giá mong muốn (₫, không bắt buộc)" name="expectedPriceVnd" type="number" min="1" max="9999999999999" step="1" /><label>Tình trạng thiết bị<textarea name="conditionNotes" required rows={5} maxLength={4000} placeholder="Ngoại hình, số lần chụp, phụ kiện đi kèm, lịch sử sửa chữa…" /></label>{notice && <p className="account-notice" role="status">{notice}</p>}{error && <p className="account-error" role="alert">{error}</p>}<Button disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi yêu cầu thu mua'}<Icon name="arrow_forward" /></Button></form><aside className="surface-card seller-guide"><Icon name="published_with_changes" /><h2>Đổi thiết bị. Giữ đam mê.</h2><p>Ba bước để tiếp nối hành trình của chiếc máy.</p>{['Gửi thông tin thiết bị và tình trạng thực tế','Tiếp nhận yêu cầu, trao đổi & kiểm tra','Thống nhất giá và phương thức bàn giao'].map((text,index) => <div className="seller-tip" key={text}><span className="section-number">0{index+1}</span><p>{text}</p></div>)}<p className="form-help">Gửi yêu cầu chưa tạo hợp đồng thu mua hoặc khoản thanh toán.</p></aside></div><section className="surface-card"><h2>Yêu cầu đã gửi</h2>{requests.isPending && <p>Đang tải yêu cầu…</p>}{requests.isError && <p className="account-error" role="alert">Chưa tải được yêu cầu. <button onClick={() => void requests.refetch()}>Thử lại</button></p>}{requests.isSuccess && !requests.data.length && <p>Chưa có yêu cầu thu mua.</p>}{requests.data?.map(item => <div className="buyback-row" key={item.id}><div><strong>{item.model}</strong><p>{item.conditionNotes}</p></div><span>{item.expectedPriceVnd ? formatVnd(item.expectedPriceVnd) : 'Chờ trao đổi giá'}</span><span className="order-status">{({ PENDING:'Đã tiếp nhận', CONTACTED:'Đã liên hệ', CLOSED:'Đã đóng' } as Record<string,string>)[item.status]}</span></div>)}</section></>;
}

export function AddressBook() {
  const session = useQuery({ queryKey: ['session'], queryFn: currentAccount });
  const addresses = useQuery({ queryKey: ['addresses',session.data?.id], queryFn: fetchAddresses });
  const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setError('');
    try { await request('/api/marketplace/addresses', { recipientName:String(data.get('recipientName')), phone:String(data.get('phone')), province:String(data.get('province')), streetAddress:String(data.get('streetAddress')), isDefault:data.get('isDefault') === 'on' } satisfies Address); form.reset(); await addresses.refetch(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : 'Chưa lưu được địa chỉ.'); } finally { setBusy(false); }
  }
  return <div className="profile-columns"><section className="surface-card"><h2>Sổ địa chỉ nhận thiết bị</h2>{addresses.isPending && <p>Đang tải địa chỉ…</p>}{addresses.isError && <p className="account-error">Chưa tải được địa chỉ. <button onClick={() => void addresses.refetch()}>Thử lại</button></p>}{addresses.data?.map(item => <div className="address-card" key={item.id}><Icon name="location_on" /><div><strong>{item.recipientName} {item.isDefault && <span className="order-status">Mặc định</span>}</strong><p>{item.phone}</p><p>{item.streetAddress}, {item.province}</p></div></div>)}{addresses.isSuccess && !addresses.data.length && <p>Bạn chưa lưu địa chỉ nhận thiết bị.</p>}</section><form className="surface-card account-form" onSubmit={submit}><h2>Thêm địa chỉ mới</h2><Input name="recipientName" label="Họ tên người nhận" required maxLength={160} autoComplete="name" /><Input name="phone" label="Số điện thoại" type="tel" required pattern="[+0-9 ()-]{8,20}" autoComplete="tel" /><Input name="province" label="Tỉnh / Thành phố" required maxLength={160} autoComplete="address-level1" /><Input name="streetAddress" label="Địa chỉ đầy đủ" required maxLength={500} autoComplete="street-address" /><label className="terms-check"><input name="isDefault" type="checkbox" /><span>Đặt làm địa chỉ mặc định</span></label>{error && <p role="alert" className="account-error">{error}</p>}<Button disabled={busy}>{busy?'Đang lưu…':'Lưu địa chỉ'}<Icon name="check" /></Button></form></div>;
}

export { MyListings } from './MyListings';
