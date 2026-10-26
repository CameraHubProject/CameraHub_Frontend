import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {AiChatAnswer} from './AiChatAnswer';

describe('AI answer rendering', () => {
    it('renders clickable inline citations and a readable source list', () => {
        const html = renderToStaticMarkup(<MemoryRouter><AiChatAnswer text="Thông số [cite]." citations={[{
            start: 9,
            end: 15,
            url: 'https://www.sony.com/',
            title: 'Sony official'
        }]}/></MemoryRouter>);
        expect(html).toContain('href="https://www.sony.com/"');
        expect(html).toContain('Nguồn tham khảo');
        expect(html).toContain('[1]');
        expect(html).not.toContain('[cite]');
    });
    it('escapes model HTML and refuses executable links while allowing current product links', () => {
        const text = '<script>alert(1)</script> [bad](javascript:alert) **Máy ảnh** [Xem máy](/may-anh/00000000-0000-0000-0000-000000000001)';
        const html = renderToStaticMarkup(<MemoryRouter><AiChatAnswer text={text} citations={[]}/></MemoryRouter>);
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('href="javascript:');
        expect(html).toContain('<strong>Máy ảnh</strong>');
        expect(html).toContain('href="/may-anh/00000000-0000-0000-0000-000000000001"');
    });
    it('renders bold product links as links without exposing the Markdown or product ID as the label', () => {
        const html = renderToStaticMarkup(<MemoryRouter><AiChatAnswer
            text="**[Sony a6400](/may-anh/00000000-0000-0000-0000-000000000001)**" citations={[]}/></MemoryRouter>);
        expect(html).toContain('<strong><a');
        expect(html).toContain('>Sony a6400</a></strong>');
        expect(html).not.toContain('[Sony a6400]');
    });
});
