import {useId} from 'react';

/** Generic vector illustrations, never presented as photographs of a seller's device. */
export function EquipmentIllustration({type}: { type: 'BODY' | 'LENS' | 'OTHER' }) {
    const id = useId().replace(/:/g, '');
    return <svg className="equipment-illustration" viewBox="0 0 400 260" role="img"
                aria-label={type === 'BODY' ? 'Hình minh họa thân máy ảnh' : type === 'LENS' ? 'Hình minh họa ống kính' : 'Hình minh họa phụ kiện đèn flash'}>
        <defs>
            <linearGradient id={`${id}body`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#464744"/>
                <stop offset=".5" stopColor="#242623"/>
                <stop offset="1" stopColor="#111310"/>
            </linearGradient>
            <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#536164"/>
                <stop offset=".4" stopColor="#192329"/>
                <stop offset=".7" stopColor="#353f39"/>
                <stop offset="1" stopColor="#09100f"/>
            </linearGradient>
            <filter id={`${id}shadow`}>
                <feGaussianBlur stdDeviation="8"/>
            </filter>
        </defs>
        <ellipse cx="205" cy="225" rx={type === 'BODY' ? 123 : 85} ry="11" fill="#242821" opacity=".16"
                 filter={`url(#${id}shadow)`}/>
        {type === 'BODY' ? <g transform="translate(0 -4)">
            <path d="M96 88h61l17-22h57l16 22h38q21 0 21 23v90q0 19-20 19H97q-17 0-17-20v-88q0-24 16-24"
                  fill={`url(#${id}body)`} stroke="#4a4c46" strokeWidth="2"/>
            <path d="M102 94h31v111h-31q-11 0-11-12v-86q0-13 11-13" fill="#1a1b18"/>
            <path d="M154 88h91l-16-20h-51z" fill="#44463f"/>
            <rect x="168" y="78" width="62" height="12" rx="4" fill="#111310"/>
            <rect x="115" y="79" width="31" height="9" rx="4" fill="#4c4e48"/>
            <circle cx="270" cy="106" r="6" fill="#3e4039"/>
            <text x="137" y="111" fontSize="9" fill="#d1d3ca" fontFamily="sans-serif" letterSpacing="1.2">CAMERAHUB
            </text>
            <circle cx="211" cy="160" r="63" fill="#171a17" stroke="#53564b" strokeWidth="5"/>
            <circle cx="211" cy="160" r="50" fill="#252b26" stroke="#7b8171" strokeWidth="2"/>
            <circle cx="211" cy="160" r="39" fill={`url(#${id}glass)`} stroke="#0d110f" strokeWidth="9"/>
            <ellipse cx="199" cy="146" rx="16" ry="24" transform="rotate(40 199 146)" fill="#b5c5ba" opacity=".12"/>
            <circle cx="211" cy="160" r="10" fill="#0a1413"/>
            <circle cx="285" cy="187" r="4" fill="#747962"/>
        </g> : type === 'LENS' ? <g transform="translate(0 -5)">
            <path d="M135 93q65-43 130 0v103q-65 43-130 0z" fill={`url(#${id}body)`} stroke="#4a4c46" strokeWidth="2"/>
            <ellipse cx="200" cy="193" rx="65" ry="24" fill="#151814"/>
            <path d="M133 123q67 41 134 0v37q-67 40-134 0z" fill="#383b33"/>
            <path
                d="M138 128v26m8-22v26m8-22v26m8-23v27m8-23v27m8-24v27m8-25v27m8-26v27m8-27v27m8-28v27m8-28v27m8-29v27m8-29v27m8-30v27m8-30v26m8-30v26"
                stroke="#171a16" strokeWidth="3"/>
            <ellipse cx="200" cy="92" rx="67" ry="39" fill="#111710" stroke="#52584a" strokeWidth="4"/>
            <ellipse cx="200" cy="92" rx="52" ry="29" fill={`url(#${id}glass)`} stroke="#333b31" strokeWidth="5"/>
            <ellipse cx="200" cy="92" rx="20" ry="13" fill="#0a1210"/>
            <path d="M163 76q23-11 40-4" fill="none" stroke="#b2bdab" opacity=".3" strokeWidth="4"/>
            <path d="M140 178q60 34 120 0" stroke="#8b9276" strokeWidth="3" fill="none"/>
        </g> : <g transform="rotate(-10 200 140)">
            <rect x="173" y="129" width="58" height="82" rx="12" fill={`url(#${id}body)`} stroke="#56594e"
                  strokeWidth="2"/>
            <path d="M185 210h35v10h-35z" fill="#33392f"/>
            <circle cx="200" cy="93" r="54" fill={`url(#${id}body)`} stroke="#56594e" strokeWidth="3"/>
            <circle cx="200" cy="93" r="43" fill="#e7e3d8"/>
            <circle cx="200" cy="93" r="32" fill="#f4f0e8" stroke="#d1ccbd" strokeWidth="2"/>
            <path d="M166 82h68m-70 12h72m-68 12h64" stroke="#d1ccbd" strokeWidth="3"/>
            <rect x="185" y="151" width="32" height="22" rx="4" fill="#9aab8c"/>
            <circle cx="201" cy="188" r="7" fill="#4a4f43"/>
        </g>}
    </svg>;
}
