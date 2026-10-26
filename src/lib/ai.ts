import {readApi, checkedResponse as checked} from './apiResponse';
import type {Product} from './products';

export interface AiCitation {
    start: number;
    end: number;
    url: string;
    title: string
}

export interface AiMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    citations: AiCitation[];
    products: Product[];
    webSearched: boolean;
    createdAt: string
}

export interface AiConversation {
    messages: AiMessage[]
}

export interface AiStatus {
    enabled: boolean;
    webSearchEnabled: boolean
}

export async function fetchAiStatus(): Promise<AiStatus> {
    return readApi((await checked(await fetch('/api/ai/status', {
        credentials: 'same-origin',
        signal: AbortSignal.timeout(10_000)
    })))) as Promise<AiStatus>;
}

export async function fetchAiConversation(): Promise<AiConversation> {
    return readApi((await checked(await fetch('/api/ai/conversation', {
        credentials: 'same-origin',
        signal: AbortSignal.timeout(10_000)
    })))) as Promise<AiConversation>;
}

async function postAi(path: string, body: unknown, signal?: AbortSignal): Promise<AiConversation> {
    const csrf = await readApi((await checked(await fetch('/api/auth/csrf', {
        credentials: 'same-origin',
        signal: AbortSignal.timeout(10_000)
    })))) as { headerName: string; token: string };
    if (csrf.headerName !== 'X-CSRF-TOKEN' || !csrf.token) throw new Error('Chưa khởi tạo được phiên bảo mật.');
    const response = await fetch(path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json', [csrf.headerName]: csrf.token},
        body: JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(80_000)]) : AbortSignal.timeout(80_000)
    });
    return readApi((await checked(response))) as Promise<AiConversation>;
}

export const sendAiMessage = (message: string, webSearch: boolean, productId?: string, signal?: AbortSignal) => postAi('/api/ai/chat', {
    message,
    webSearch, ...(productId ? {productId} : {})
}, signal);
export const resetAiConversation = () => postAi('/api/ai/conversation/reset', {});

export function openAiChat(message?: string) {
    window.dispatchEvent(new CustomEvent('camerahub:open-ai', {detail: {message}}));
}

export function safeChatUrl(value: string): boolean {
    if (/^\/may-anh\/[a-f0-9-]{36}$/i.test(value)) return true;
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && !!url.hostname && !url.username && !url.password;
    } catch {
        return false;
    }
}
