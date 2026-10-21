import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Icon, Input } from './ui';
import { currentAccount, fetchVerifications, login, logout, register, reviewVerification, submitVerification } from '../lib/identity';
import type { Verification } from '../lib/identity';
import { SiteFooter, SiteHeader } from './SiteLayout';

const labels: Record<Verification['status'], string> = {
  PENDING: 'Đang chờ xét duyệt', VERIFIED: 'Đã xác minh Seller', NEEDS_REVISION: 'Cần bổ sung hồ sơ', REJECTED: 'Hồ sơ bị từ chối',
};
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Chưa thực hiện được. Vui lòng thử lại.';
const sessionOptions = { queryKey: ['session'], queryFn: currentAccount, retry: false, staleTime: 15_000 };

export function AccountLink() {
  const session = useQuery(sessionOptions);
  return <Link className="account-link" to="/tai-khoan"><Icon name="person" /><span>{session.data ? 'Tài khoản' : 'Đăng nhập'}</span></Link>;
}

function Frame({ children }: { children: ReactNode }) {
  return <div className="account-page"><SiteHeader /><main className="account-main container">{children}</main><SiteFooter /></div>;
}

export function AuthPage({ create = false }: { create?: boolean }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const session = useQuery(sessionOptions);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email')); const password = String(data.get('password'));
    try {
      if (create && !registered) {
        if (password !== String(data.get('confirmPassword'))) throw new Error('Mật khẩu xác nhận chưa khớp.');
        if (new TextEncoder().encode(password).length > 72) throw new Error('Mật khẩu tối đa 72 byte UTF-8.');
        await register({ email, password, fullName: String(data.get('fullName')), phone: String(data.get('phone') ?? '') });
        setRegistered(true);
      }
      await login(email, password);
      client.clear();
      navigate('/tai-khoan', { replace: true });
    } catch (exception) { setError(errorMessage(exception)); }
    finally { setBusy(false); }
  }
  return <div className="auth-prototype"><div className="auth-backdrop" aria-hidden="true"><img src="/images/hero-cameras.jpg" alt="" /><span /></div><main className="auth-dialog"><header className="auth-dialog-header"><span className="auth-logo"><Icon name="photo_camera" /></span><div><Link className="brand" to="/">CameraHub</Link><p>Kết nối người yêu máy ảnh. Tiếp nối đam mê.</p></div><Link className="auth-close" to="/" aria-label="Đóng và về trang chủ"><Icon name="close" /></Link></header><nav className="auth-tabs" aria-label="Tài khoản CameraHub"><Link className={!create ? 'selected' : ''} to="/dang-nhap">Đăng nhập</Link><Link className={create ? 'selected' : ''} to="/dang-ky">Đăng ký thành viên</Link></nav>
    {session.data ? <div className="auth-existing"><h1>Bạn đã đăng nhập</h1><p>Chào {session.data.fullName}, tiếp tục tới tài khoản của bạn.</p><Link className="button button-primary" to="/tai-khoan">Mở tài khoản<Icon name="arrow_forward" /></Link></div> : <><h1 className="sr-only">{create ? 'Tạo tài khoản CameraHub' : 'Đăng nhập CameraHub'}</h1><form className="account-form prototype-auth-form" onSubmit={submit}>
      {create && <Input label="Họ và tên đầy đủ" icon="person" name="fullName" placeholder="Họ và tên đầy đủ" autoComplete="name" required maxLength={160} />}
      <Input label="Email" icon="alternate_email" name="email" type="email" placeholder="email@example.com" autoComplete="username" required maxLength={254} />
      {create && <Input label="Số điện thoại (không bắt buộc)" icon="smartphone" name="phone" type="tel" placeholder="Số điện thoại của bạn" autoComplete="tel" maxLength={20} />}
      <Input label="Mật khẩu" icon="lock" name="password" type={showPassword ? 'text' : 'password'} placeholder={create ? 'Tối thiểu 12 ký tự' : 'Nhập mật khẩu của bạn'} autoComplete={create ? 'new-password' : 'current-password'} required minLength={create ? 12 : undefined} maxLength={72} trailing={<button className="password-toggle" type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><Icon name={showPassword ? 'visibility_off' : 'visibility'} /></button>} />
      {create && <><Input label="Xác nhận lại mật khẩu" icon="lock_reset" name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Nhập lại mật khẩu vừa tạo" autoComplete="new-password" required minLength={12} maxLength={72} /><small>Dùng 12–72 ký tự; tối đa 72 byte nếu có dấu hoặc emoji.</small></>}
      {registered && <p role="status">Tài khoản đã tạo. Bạn có thể thử đăng nhập lại.</p>}{error && <p className="account-error" role="alert">{error}</p>}
      <Button disabled={busy}>{busy ? 'Đang xử lý…' : create && !registered ? 'Đăng ký thành viên' : 'Đăng nhập tài khoản'}<Icon name="arrow_forward" /></Button>
    </form><div className="auth-privacy"><Icon name="verified_user" /><span>Thông tin tài khoản và hồ sơ xác minh của bạn được giữ riêng tư.</span></div><p className="auth-switch">{create ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}<Link to={create ? '/dang-nhap' : '/dang-ky'}>{create ? 'Đăng nhập' : 'Đăng ký ngay'}</Link></p></>}
    <div className="auth-demo-note"><span className="tiny-dot" />CameraHub · Môi trường giao dịch mô phỏng</div>
  </main></div>;
}

function VerificationCard({ item, admin = false, onChange }: { item: Verification; admin?: boolean; onChange?: () => Promise<void> }) {
  const [note, setNote] = useState(''); const [decision, setDecision] = useState('VERIFIED');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function review(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await reviewVerification(item.id, decision, note); await onChange?.(); }
    catch (exception) { setError(errorMessage(exception)); }
    finally { setBusy(false); }
  }
  return <article className="verification-card"><div className="verification-heading"><strong>{admin ? item.fullName : 'Hồ sơ xác minh người bán'}</strong><span className={`verification-status status-${item.status.toLowerCase()}`}>{labels[item.status]}</span></div><small>Gửi lúc {new Date(item.createdAt).toLocaleString('vi-VN')}</small>{item.reviewNote && <p><strong>Ghi chú xét duyệt:</strong> {item.reviewNote}</p>}<a className="evidence-link" href={`/api/seller-verification/${encodeURIComponent(item.id)}/evidence`}><Icon name="download" />Tải hồ sơ riêng tư</a>
    {admin && item.status === 'PENDING' && <form className="account-form review-form" onSubmit={review}><label>Quyết định<select value={decision} onChange={event => setDecision(event.target.value)}><option value="VERIFIED">Duyệt xác minh Seller</option><option value="NEEDS_REVISION">Yêu cầu bổ sung</option><option value="REJECTED">Từ chối</option></select></label><label>Lý do / ghi chú<textarea required maxLength={2000} value={note} onChange={event => setNote(event.target.value)} rows={3} /></label>{error && <p className="account-error" role="alert">{error}</p>}<Button disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu quyết định'}</Button></form>}
  </article>;
}

export function AccountPage({ admin = false }: { admin?: boolean }) {
  const client = useQueryClient(); const navigate = useNavigate();
  const session = useQuery(sessionOptions);
  const allowed = !!session.data && (!admin || session.data.roles.includes('ADMIN'));
  const records = useQuery({ queryKey: ['verifications', admin, session.data?.id], queryFn: () => fetchVerifications(admin), enabled: allowed, retry: false });
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  async function refresh() { await client.invalidateQueries({ queryKey: ['verifications'] }); await client.invalidateQueries({ queryKey: ['session'] }); }
  async function leave() {
    setBusy(true); setError('');
    try { await logout(); client.clear(); navigate('/dang-nhap', { replace: true }); }
    catch (exception) { setError(errorMessage(exception)); }
    finally { setBusy(false); }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    const file = new FormData(form).get('file');
    if (!(file instanceof File) || !file.size) { setError('Vui lòng chọn file hồ sơ.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Hồ sơ tối đa 5 MB.'); return; }
    setBusy(true); setError(''); setNotice('');
    try { await submitVerification(file); form.reset(); setNotice('Đã gửi hồ sơ. Bạn có thể theo dõi kết quả tại đây.'); await refresh(); }
    catch (exception) { setError(errorMessage(exception)); }
    finally { setBusy(false); }
  }
  if (session.isPending) return <Frame><p role="status">Đang tải tài khoản…</p></Frame>;
  if (session.isError) return <Frame><div className="account-card"><h1>Chưa kết nối được máy chủ</h1><Button onClick={() => void session.refetch()}>Thử lại</Button></div></Frame>;
  if (!session.data) return <Frame><div className="account-card"><h1>Đăng nhập để tiếp tục</h1><p>Theo dõi tài khoản và hồ sơ người bán của bạn.</p><Link className="button button-primary" to="/dang-nhap">Đăng nhập</Link><p><Link to="/dang-ky">Tạo tài khoản mới</Link></p></div></Frame>;
  if (!allowed) return <Frame><div className="account-card"><h1>Bạn chưa có quyền quản trị</h1><Link to="/tai-khoan">Về tài khoản</Link></div></Frame>;
  const canSubmit = !admin && records.isSuccess && !records.data.some(item => item.status === 'PENDING' || item.status === 'VERIFIED');
  return <Frame><div className="account-title"><div><p className="eyebrow">{admin ? 'QUẢN TRỊ CAMERAHUB' : 'TÀI KHOẢN CỦA BẠN'}</p><h1>{admin ? 'Xét duyệt người bán' : `Xin chào, ${session.data.fullName}`}</h1><p>{session.data.email}</p></div><Button variant="secondary" onClick={leave} disabled={busy}>Đăng xuất<Icon name="logout" /></Button></div><nav className="account-nav"><Link to="/tai-khoan">Tài khoản & xác minh</Link>{session.data.roles.includes('ADMIN') && <Link to="/quan-tri/xac-minh">Xét duyệt Seller</Link>}</nav>
    {!admin && <section className="account-card account-summary"><Icon name={session.data.roles.includes('SELLER') ? 'verified_user' : 'person'} /><div><h2>{session.data.roles.includes('SELLER') ? 'Bạn đã được xác minh Seller' : 'Trở thành người bán'}</h2><p>{session.data.roles.includes('SELLER') ? 'Tài khoản đã được cấp quyền Seller. Bạn có thể gửi tin đăng từ mục Đăng tin thiết bị trong tài khoản.' : 'Gửi hồ sơ để Admin xác minh trước khi được cấp quyền đăng bán.'}</p></div></section>}
    {records.isPending && <p role="status">Đang tải hồ sơ…</p>}{records.isError && <p className="account-error" role="alert">{errorMessage(records.error)} <button onClick={() => void records.refetch()}>Thử lại</button></p>}
    {records.data?.map(item => <VerificationCard key={item.id} item={item} admin={admin} onChange={refresh} />)}
    {admin && records.isSuccess && records.data.length === 0 && <div className="account-card"><h2>Chưa có hồ sơ cần xử lý</h2><p>Hồ sơ người bán sẽ xuất hiện tại đây sau khi được gửi.</p></div>}
    {canSubmit && <section className="account-card"><h2>{records.data?.some(item => item.status === 'NEEDS_REVISION') ? 'Bổ sung hồ sơ xác minh' : 'Gửi hồ sơ xác minh'}</h2><p>Tải một file JPG, PNG hoặc PDF rõ nét, tối đa 5 MB. Bạn và Admin mới có quyền tải file này.</p><form className="account-form" onSubmit={upload}><label htmlFor="verification-file">File hồ sơ xác minh</label><input id="verification-file" name="file" type="file" accept="image/jpeg,image/png,application/pdf" required disabled={busy} /><Button disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi hồ sơ'}<Icon name="upload_file" /></Button></form></section>}
    {error && <p className="account-error" role="alert">{error}</p>}{notice && <p className="account-notice" role="status">{notice}</p>}
  </Frame>;
}
