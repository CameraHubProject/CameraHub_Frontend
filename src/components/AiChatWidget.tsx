import {errorMessage} from '../lib/apiResponse';
import {useEffect, useRef, useState} from 'react';
import type {FormEvent} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {currentAccount} from '../lib/identity';
import {fetchAiConversation, fetchAiStatus, resetAiConversation, sendAiMessage} from '../lib/ai';
import type {AiMessage} from '../lib/ai';
import {formatVnd} from '../lib/products';
import {Button, Icon, ProductMedia} from './ui';
import {AiChatAnswer} from './AiChatAnswer';
import './ai-chat.css';

const suggestions = ['Mới chơi máy ảnh, ngân sách khoảng 15 triệu', 'Tìm máy gọn nhẹ chụp du lịch trong kho', 'So sánh máy quay vlog và máy chụp ảnh'];
const camiIntroduction = 'Mình là Cami, trợ lý AI của CameraHub.';
const camiCapabilities = 'Mình có thể giúp bạn chọn máy ảnh phù hợp với ngân sách, so sánh các dòng máy và tìm hiểu tình trạng máy cũ. 📸';
const camiQuestion = 'Bạn muốn mình giúp gì hôm nay?';

function CamiAvatar() {
    return <svg className="cami-avatar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5"/>
        <path
            d="m14.31 8 5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16 3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/>
    </svg>;
}

export function AiChatWidget() {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState('');
    const [web, setWeb] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [pending, setPending] = useState('');
    const [queued, setQueued] = useState('');
    const client = useQueryClient();
    const location = useLocation();
    const account = useQuery({queryKey: ['session'], queryFn: currentAccount, retry: false, staleTime: 15_000});
    const userName = account.data?.fullName.trim() || 'bạn';
    const greeting = `Xin chào ${userName}!`;
    const historyKey = ['ai-conversation', account.data?.id ?? 'guest'];
    const history = useQuery({
        queryKey: historyKey,
        queryFn: fetchAiConversation,
        enabled: open,
        retry: false,
        staleTime: 0
    });
    const status = useQuery({
        queryKey: ['ai-status'],
        queryFn: fetchAiStatus,
        enabled: open,
        retry: false,
        staleTime: 30_000
    });
    const input = useRef<HTMLTextAreaElement>(null);
    const launcher = useRef<HTMLButtonElement>(null);
    const messagesEnd = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLElement>(null);
    const request = useRef<AbortController | null>(null);
    const sendRef = useRef<(message: string) => void>(() => undefined);
    const hidden = ['/dang-nhap', '/dang-ky'].includes(location.pathname);
    const messages = history.data?.messages ?? [];
    const enabled = status.data?.enabled && history.isSuccess;

    useEffect(() => {
        const handle = (event: Event) => {
            const message = (event as CustomEvent<{ message?: unknown }>).detail?.message;
            setOpen(true);
            setError('');
            if (typeof message === 'string' && message.trim()) {
                setQueued(message.slice(0, 2000));
                setDraft(message.slice(0, 2000));
            }
        };
        window.addEventListener('camerahub:open-ai', handle);
        return () => window.removeEventListener('camerahub:open-ai', handle);
    }, []);
    useEffect(() => {
        if (open && enabled && queued && !busy) {
            const message = queued;
            setQueued('');
            sendRef.current(message);
        }
    }, [open, enabled, queued, busy]);
    useEffect(() => {
        if (!open || hidden) return;
        const frame = requestAnimationFrame(() => input.current?.focus());
        const close = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && panel.current?.contains(document.activeElement)) {
                setOpen(false);
                requestAnimationFrame(() => launcher.current?.focus());
            }
        };
        document.addEventListener('keydown', close);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('keydown', close);
        };
    }, [open, history.isSuccess, hidden]);
    useEffect(() => {
        if (!open) return;
        if (messages.length || pending || error) messagesEnd.current?.scrollIntoView({block: 'nearest'});
        else messagesEnd.current?.parentElement?.scrollTo({top: 0});
    }, [messages.length, open, pending, error]);
    useEffect(() => {
        setPending('');
        setError('');
        setBusy(false);
        setQueued('');
        return () => request.current?.abort();
    }, [account.data?.id]);

    async function send(message: string) {
        if (busy || !enabled || !message.trim()) return;
        const question = message.trim().slice(0, 2000);
        setError('');
        setBusy(true);
        setPending(question);
        setDraft('');
        const controller = new AbortController();
        request.current = controller;
        const match = location.pathname.match(/^\/may-anh\/([a-f0-9-]{36})$/i);
        try {
            const result = await sendAiMessage(question, web && !!status.data?.webSearchEnabled, match?.[1], controller.signal);
            if (!controller.signal.aborted) client.setQueryData(historyKey, result);
        } catch (exception) {
            if (!controller.signal.aborted) {
                setError(errorMessage(exception));
                setDraft(question);
            }
        } finally {
            if (!controller.signal.aborted) {
                setBusy(false);
                setPending('');
                input.current?.focus();
            }
        }
    }

    sendRef.current = message => void send(message);

    async function reset() {
        if (busy) return;
        setBusy(true);
        setError('');
        setQueued('');
        try {
            client.setQueryData(historyKey, await resetAiConversation());
            setDraft('');
        } catch (exception) {
            setError(errorMessage(exception));
        } finally {
            setBusy(false);
        }
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        void send(draft);
    }

    function close() {
        setOpen(false);
        requestAnimationFrame(() => launcher.current?.focus());
    }

    if (hidden) return null;

    return <div className="ai-chat-widget">
        {!open &&
            <button ref={launcher} className="ai-chat-launcher" aria-label="Trò chuyện với Cami" aria-expanded={open}
                    aria-controls="camerahub-ai-chat" onClick={() => setOpen(true)}>
                <span className="ai-launcher-icon"><CamiAvatar/></span>
                <span className="ai-launcher-copy"><strong>Cami <span className="cami-name-spark"
                                                                      aria-hidden="true">✦</span></strong><small>Bạn đồng hành chọn máy</small></span>
                <span className="cami-launcher-action" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"
                                                                               stroke="currentColor" strokeWidth="1.7"
                                                                               strokeLinecap="round"
                                                                               strokeLinejoin="round"><path
                    d="M20 11.5a7.5 7.5 0 0 1-10.8 6.7L5 19l.8-4.2A7.5 7.5 0 1 1 20 11.5Z"/></svg></span>
            </button>
        }
        {open && <aside ref={panel} className="ai-chat-panel" role="dialog" aria-labelledby="ai-chat-title"
                        id="camerahub-ai-chat">
            <header className="ai-chat-header"><span className="ai-assistant-icon"><Icon name="auto_awesome"/></span>
                <div><h2 id="ai-chat-title">Cami <span className="cami-header-badge">CameraHub</span></h2><p>Bạn đồng
                    hành cho từng góc nhìn</p></div>
                <button type="button" className="ai-header-action" aria-label="Cuộc trò chuyện mới"
                        title="Cuộc trò chuyện mới" disabled={busy || history.isPending} onClick={() => void reset()}>
                    <Icon name="add_comment"/></button>
                <button type="button" className="ai-header-action" aria-label="Đóng hộp chat Cami" onClick={close}><Icon
                    name="close"/></button>
            </header>
            <div className="ai-chat-scope"><Icon
                name="inventory_2"/><span>Đối chiếu giá và tin đang bán tại CameraHub.</span></div>
            <div className="ai-chat-messages" role="log" aria-live="polite" aria-label="Cuộc trò chuyện với Cami">
                {(history.isPending || status.isPending) &&
                    <p className="ai-chat-loading" role="status">Đang kết nối trợ lý…</p>}
                {(history.isError || status.isError) &&
                    <div className="ai-chat-error" role="alert"><p>Chưa kết nối được trợ lý. Bạn có thể thử lại.</p>
                        <Button variant="secondary" onClick={() => {
                            void history.refetch();
                            void status.refetch();
                        }}>Thử lại</Button></div>}
                {status.isSuccess && !status.data.enabled &&
                    <div className="ai-chat-error"><p>Trợ lý AI tạm thời chưa sẵn sàng. Bạn vẫn có thể tìm thiết bị
                        trong kho máy.</p><Link to="/may-anh" onClick={close}>Khám phá kho máy<Icon
                        name="arrow_forward"/></Link></div>}
                {!messages.length && !pending &&
                    <div className="ai-chat-welcome"><span><CamiAvatar/></span><span className="cami-welcome-eyebrow">MỘT GÓC NHÌN MỚI, CÙNG CAMI</span>
                        <h3>{greeting}</h3><p>{camiIntroduction}</p><p>{camiCapabilities}</p><p
                            className="cami-welcome-question">{camiQuestion}</p>
                        <div className="ai-chat-suggestions">{suggestions.map(suggestion => <button type="button"
                                                                                                    key={suggestion}
                                                                                                    disabled={!enabled || busy}
                                                                                                    onClick={() => void send(suggestion)}>{suggestion}<Icon
                            name="north_east"/></button>)}</div>
                    </div>}
                {messages.map(message => <ChatMessage key={message.id} message={message} onProduct={close}/>)}
                {pending && <div className="ai-chat-message is-user"><p>{pending}</p></div>}
                {busy && pending && <div className="ai-chat-thinking" role="status"><span/><span/><span/>
                    <p>{web && status.data?.webSearchEnabled ? 'Đang đối chiếu kho máy và tìm thông tin phù hợp…' : 'Đang đối chiếu thiết bị trong kho…'}</p>
                </div>}
                {error && <p className="ai-chat-error" role="alert">{error}</p>}
                <div ref={messagesEnd}/>
            </div>
            <form className="ai-chat-compose" onSubmit={submit}><label className="ai-web-option"><input type="checkbox"
                                                                                                        checked={web}
                                                                                                        disabled={!status.data?.webSearchEnabled || busy}
                                                                                                        onChange={event => setWeb(event.target.checked)}/><Icon
                name="travel_explore"/><span>Cho phép tra cứu web</span></label>
                <div className="ai-chat-input"><textarea ref={input} aria-label="Câu hỏi dành cho Cami"
                                                         placeholder="Kể Cami nghe bạn đang tìm gì nhé…" rows={2}
                                                         value={draft} maxLength={2000} disabled={busy || !enabled}
                                                         onChange={event => setDraft(event.target.value)}
                                                         onKeyDown={event => {
                                                             if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                                                                 event.preventDefault();
                                                                 void send(draft);
                                                             }
                                                         }}/>
                    <button type="submit" aria-label="Gửi câu hỏi cho Cami"
                            disabled={busy || !enabled || !draft.trim()}><Icon
                        name={busy ? 'progress_activity' : 'arrow_upward'}/></button>
                </div>
                <p>Cami có thể nhầm. Kiểm tra lại tin đăng trước khi mua. Nội dung chat được gửi đến OpenAI để trả
                    lời.</p></form>
        </aside>}
    </div>;
}

function ChatMessage({message, onProduct}: { message: AiMessage; onProduct: () => void }) {
    if (message.role === 'user') return <div className="ai-chat-message is-user"><p>{message.text}</p></div>;
    return <article className="ai-chat-message is-assistant">
        <div className="ai-message-label"><Icon name="auto_awesome"/><strong>Cami</strong>{message.webSearched &&
            <span><Icon name="travel_explore"/>Đã tra cứu web</span>}</div>
        <AiChatAnswer text={message.text} citations={message.citations}/>{message.products.length > 0 &&
        <div className="ai-chat-products">{message.products.map(product => <Link key={product.id}
                                                                                 to={`/may-anh/${product.id}`}
                                                                                 onClick={onProduct}><span
            className="ai-chat-product-photo"><ProductMedia
            product={product}/></span><span><strong>{product.title}</strong><small>{formatVnd(product.priceVnd)}</small><span>Xem tin đăng<Icon
            name="arrow_forward"/></span></span></Link>)}</div>}</article>;
}
