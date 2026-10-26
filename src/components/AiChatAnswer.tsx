import {Fragment} from 'react';
import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {safeChatUrl} from '../lib/ai';
import type {AiCitation} from '../lib/ai';

function inline(text: string): ReactNode[] {
    const result: ReactNode[] = [];
    const pattern = /\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*/g;
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text))) {
        result.push(text.slice(cursor, match.index));
        if (match[3]) result.push(<strong key={match.index}>{inline(match[3])}</strong>);
        else if (safeChatUrl(match[2])) result.push(match[2].startsWith('/') ?
            <Link key={match.index} to={match[2]}>{inline(match[1])}</Link> :
            <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer">{inline(match[1])}</a>);
        else result.push(match[1]);
        cursor = pattern.lastIndex;
    }
    result.push(text.slice(cursor));
    return result;
}

export function AiChatAnswer({text, citations}: { text: string; citations: AiCitation[] }) {
    const sources = [...new Map(citations.filter(item => safeChatUrl(item.url)).map(item => [item.url, item])).values()];
    const pieces: ReactNode[] = [];
    let cursor = 0;
    for (const citation of [...citations].sort((a, b) => a.start - b.start)) {
        if (!safeChatUrl(citation.url) || citation.start < cursor || citation.end > text.length || citation.end <= citation.start) continue;
        pieces.push(<Fragment key={`text-${cursor}`}>{inline(text.slice(cursor, citation.start))}</Fragment>);
        pieces.push(<a className="ai-inline-source" key={`cite-${citation.start}`} href={citation.url} target="_blank"
                       rel="noopener noreferrer"
                       title={citation.title}>[{sources.findIndex(source => source.url === citation.url) + 1}]</a>);
        cursor = citation.end;
    }
    pieces.push(<Fragment key={`text-${cursor}`}>{inline(text.slice(cursor))}</Fragment>);
    return <>
        <div className="ai-answer-text">{pieces}</div>
        {sources.length > 0 &&
            <nav className="ai-answer-sources" aria-label="Nguồn tham khảo trên web"><strong>Nguồn tham
                khảo</strong>{sources.map((source, index) => <a key={source.url} href={source.url} target="_blank"
                                                                rel="noopener noreferrer">{index + 1}. {source.title || new URL(source.url).hostname}</a>)}
            </nav>}</>;
}
