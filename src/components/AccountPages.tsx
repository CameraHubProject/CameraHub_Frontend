import {useState} from 'react';
import type {FormEvent} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {Button, Icon, Input} from './ui';
import {ApiError,errorMessage} from '../lib/apiResponse';
import {
    confirmGoogleLink,
    currentAccount,
    googleLoginStatus,
    login,
    register
} from '../lib/identity';

const sessionOptions = {queryKey: ['session'], queryFn: currentAccount, retry: false, staleTime: 15_000};

export function AccountLink() {
    const session = useQuery(sessionOptions);
    return <Link className="account-link" to="/tai-khoan"><Icon
        name="person"/><span>{session.data ? session.data.fullName : 'Đăng nhập'}</span></Link>;
}


export function AuthPage({create = false}: { create?: boolean }) {
    const navigate = useNavigate();
    const client = useQueryClient();
    const session = useQuery(sessionOptions);
    const [params] = useSearchParams();
    const google = useQuery({queryKey: ['google-login',params.get('google')], queryFn: () => googleLoginStatus(params.get('google') ?? undefined), retry: false, staleTime: 0});
    const googleMessage = google.data?.message ?? '';
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [fields,setFields]=useState<Record<string,string>>({});
    const [registered, setRegistered] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function linkGoogle(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setBusy(true);
        try {
            await confirmGoogleLink(String(new FormData(event.currentTarget).get('linkPassword')));
            client.clear();
            navigate('/tai-khoan', {replace: true});
        } catch (exception) {
            setError(errorMessage(exception));
            if(exception instanceof ApiError)setFields(exception.errors);
            void google.refetch();
        } finally {
            setBusy(false);
        }
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setBusy(true);
        const data = new FormData(event.currentTarget);
        const email = String(data.get('email'));
        const password = String(data.get('password'));
        try {
            if (create && !registered) {
                await register({
                    email,
                    password,
                    confirmPassword: String(data.get('confirmPassword')),
                    fullName: String(data.get('fullName')),
                    phone: String(data.get('phone') ?? '')
                });
                setRegistered(true);
            }
            await login(email, password);
            client.clear();
            navigate('/tai-khoan', {replace: true});
        } catch (exception) {
            setError(errorMessage(exception));
            if(exception instanceof ApiError)setFields(exception.errors);
        } finally {
            setBusy(false);
        }
    }

    return <div className="auth-prototype">
        <div className="auth-backdrop" aria-hidden="true"><img src="/images/hero-cameras.jpg" alt=""/><span/></div>
        <main className="auth-dialog">
            <header className="auth-dialog-header"><span className="auth-logo"><Icon name="photo_camera"/></span>
                <div><Link className="brand" to="/">CameraHub</Link><p>Kết nối người yêu máy ảnh. Tiếp nối đam mê.</p>
                </div>
                <Link className="auth-close" to="/" aria-label="Đóng và về trang chủ"><Icon name="close"/></Link>
            </header>
            <nav className="auth-tabs" aria-label="Tài khoản CameraHub"><Link className={!create ? 'selected' : ''}
                                                                              to="/dang-nhap">Đăng nhập</Link><Link
                className={create ? 'selected' : ''} to="/dang-ky">Đăng ký thành viên</Link></nav>
            {session.data ?
                <div className="auth-existing"><h1>Bạn đã đăng nhập</h1><p>Chào {session.data.fullName}, tiếp tục tới
                    tài khoản của bạn.</p><Link className="button button-primary" to="/tai-khoan">Mở tài khoản<Icon
                    name="arrow_forward"/></Link></div> : <><h1
                    className="sr-only">{create ? 'Tạo tài khoản CameraHub' : 'Đăng nhập CameraHub'}</h1>
                    {googleMessage && <p className="google-auth-notice" role="alert">{googleMessage}</p>}
                    {error && <p className="account-error google-auth-error" role="alert">{error}</p>}
                    {google.data?.pendingEmail &&
                        <section className="google-link-panel" aria-labelledby="google-link-heading"><h2
                            id="google-link-heading">Liên kết với tài khoản đã có</h2><p>
                            <strong>{google.data.pendingEmail}</strong> đã đăng ký CameraHub. Nhập mật khẩu CameraHub để
                            liên kết Google và giữ nguyên tin đăng, đơn hàng của bạn.</p>
                            <form className="account-form" onSubmit={linkGoogle}><Input name="linkPassword"
                                                                                        label="Mật khẩu CameraHub hiện tại"
                                                                                        type="password"
                                                                                        autoComplete="current-password"
                                                                                        required maxLength={72}/><Button
                                loading={busy}>Liên kết và đăng nhập</Button></form>
                        </section>}
                    <div className="google-auth"><a className="google-auth-button" href="/api/auth/oauth2/google"
                                                    aria-disabled={!google.data?.enabled || busy} onClick={event => {
                        if (!google.data?.enabled || busy) event.preventDefault();
                    }}>
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#4285F4"
                                  d="M43.6 24.5c0-1.4-.1-2.7-.4-4H24v7.6h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.8-3.5 6.1-8.6 6.1-14.8Z"/>
                            <path fill="#34A853"
                                  d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5A12.3 12.3 0 0 1 24 36c-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20.4 20.4 0 0 0 24 44Z"/>
                            <path fill="#FBBC05"
                                  d="M12.6 27.6a12.2 12.2 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z"/>
                            <path fill="#EA4335"
                                  d="M24 12c3 0 5.7 1 7.8 3l5.9-5.9A19.8 19.8 0 0 0 24 4 20.4 20.4 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"/>
                        </svg>
                        {create ? 'Đăng ký bằng Google' : 'Đăng nhập bằng Google'}</a>
                        <p>{google.isPending ? 'Đang kiểm tra kết nối Google…' : google.isError ? 'Chưa kiểm tra được kết nối Google.' : google.data?.enabled ? 'Dùng Gmail hoặc tài khoản Google của bạn. Lần đầu sẽ tạo tài khoản CameraHub.' : 'Đăng nhập Google chưa được cấu hình.'}{google.isError && <>
                            <button type="button" onClick={() => void google.refetch()}>Thử lại</button>
                        </>}</p></div>
                    <div className="auth-divider">
                        <span>{create ? 'hoặc đăng ký bằng email' : 'hoặc dùng số điện thoại / email'}</span></div>
                    <form className="account-form prototype-auth-form" noValidate onChange={()=>setFields({})} onSubmit={submit}>
                        {create &&
                            <Input label="Họ và tên đầy đủ" icon="person" name="fullName" serverError={fields.fullName} placeholder="Họ và tên đầy đủ"
                                   autoComplete="name" required maxLength={160}/>}
                        <Input label={create ? 'Email' : 'Số điện thoại hoặc email'}
                               icon={create ? 'alternate_email' : 'smartphone'} name="email" serverError={fields.email}
                               type={create ? 'email' : 'text'}
                               placeholder={create ? 'email@example.com' : '0912 345 678 hoặc email@example.com'}
                               autoComplete="username" autoCapitalize="none" spellCheck={false} required
                               maxLength={254}/>
                        {create && <><Input label="Số điện thoại" icon="smartphone" name="phone" serverError={fields.phone} type="tel"
                                            inputMode="tel" placeholder="0912 345 678" autoComplete="tel" required
                                            maxLength={20}/><small>Mỗi số điện thoại di động chỉ đăng ký một tài khoản.
                            Hỗ trợ 0… hoặc +84…</small></>}
                        <Input label="Mật khẩu" icon="lock" name="password" serverError={fields.password} type={showPassword ? 'text' : 'password'}
                               placeholder={create ? 'Tối thiểu 12 ký tự' : 'Nhập mật khẩu của bạn'}
                               autoComplete={create ? 'new-password' : 'current-password'} required
                               minLength={create ? 12 : undefined} maxLength={72}
                               trailing={<button className="password-toggle" type="button"
                                                 aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                                 aria-pressed={showPassword}
                                                 onClick={() => setShowPassword(!showPassword)}><Icon
                                   name={showPassword ? 'visibility_off' : 'visibility'}/></button>}/>
                        {create && <><Input label="Xác nhận lại mật khẩu" icon="lock_reset" name="confirmPassword" serverError={fields.confirmPassword}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Nhập lại mật khẩu vừa tạo" autoComplete="new-password" required
                                            minLength={12} maxLength={72}/><small>Dùng 12–72 ký tự; tối đa 72 byte nếu
                            có dấu hoặc emoji.</small></>}
                        {registered && <p role="status">Tài khoản đã tạo. Bạn có thể thử đăng nhập lại.</p>}
                        <Button
                            disabled={busy}>{busy ? 'Đang xử lý…' : create && !registered ? 'Đăng ký thành viên' : 'Đăng nhập tài khoản'}<Icon
                            name="arrow_forward"/></Button>
                    </form>
                    <div className="auth-privacy"><Icon name="verified_user"/><span>Thông tin liên hệ của bạn được giữ riêng tư.</span>
                    </div>
                    <p className="auth-switch">{create ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}<Link
                        to={create ? '/dang-nhap' : '/dang-ky'}>{create ? 'Đăng nhập' : 'Đăng ký ngay'}</Link></p></>}
            <div className="auth-demo-note"><span className="tiny-dot"/>CameraHub · Môi trường giao dịch mô phỏng</div>
        </main>
    </div>;
}
