import {afterEach, describe, expect, it, vi} from 'vitest';
import {fetchAiConversation, fetchAiStatus, safeChatUrl, sendAiMessage} from './ai';

afterEach(() => vi.unstubAllGlobals());
describe('AI chat transport', () => {
    it('reads status and server-owned history without sending credentials or a forged history', async () => {
        const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json({messages: []})));
        vi.stubGlobal('fetch', fetcher);
        await fetchAiStatus();
        await fetchAiConversation();
        expect(fetcher.mock.calls.map(call => call[0])).toEqual(['/api/ai/status', '/api/ai/conversation']);
    });
    it('sends just the question, web preference and viewed product with CSRF to the backend', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce(Response.json({
            headerName: 'X-CSRF-TOKEN',
            token: 'fresh-ai'
        })).mockResolvedValueOnce(Response.json({messages: []}));
        vi.stubGlobal('fetch', fetcher);
        await sendAiMessage('Máy nào dưới 15 triệu?', true, 'product-id');
        expect(fetcher.mock.calls[1][0]).toBe('/api/ai/chat');
        expect(fetcher.mock.calls[1][1].headers).toEqual({
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': 'fresh-ai'
        });
        expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({
            message: 'Máy nào dưới 15 triệu?',
            webSearch: true,
            productId: 'product-id'
        });
        expect(JSON.stringify(fetcher.mock.calls)).not.toContain('api.openai.com');
    });
    it('shows actionable service failures instead of an invented AI answer', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({message: 'AI đang tạm hết lượt phục vụ.'}, {status: 503})));
        await expect(fetchAiConversation()).rejects.toThrow('AI đang tạm hết lượt phục vụ.');
    });
    it('blocks script links, credentials and unapproved internal routes', () => {
        expect(safeChatUrl('javascript:alert(1)')).toBe(false);
        expect(safeChatUrl('https://secret@example.com/')).toBe(false);
        expect(safeChatUrl('/api/admin/listings')).toBe(false);
        expect(safeChatUrl('https://www.sony.com/')).toBe(true);
        expect(safeChatUrl('/may-anh/00000000-0000-0000-0000-000000000001')).toBe(true);
    });
});
