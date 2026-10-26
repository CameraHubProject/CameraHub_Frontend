import {useSyncExternalStore} from 'react';

const key = 'camerahub-cart-v1';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseCart(raw: string | null): string[] {
    try {
        const value: unknown = JSON.parse(raw ?? '[]');
        return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && uuid.test(id)))].slice(0, 20) : [];
    } catch {
        return [];
    }
}

let snapshot: string[] = [];
try {
    snapshot = parseCart(localStorage.getItem(key));
} catch { /* Private browsing still supports a cart for this tab. */
}
const listeners = new Set<() => void>();

function emit() {
    listeners.forEach(listener => listener());
}

function save(next: string[]) {
    snapshot = next;
    try {
        localStorage.setItem(key, JSON.stringify(next));
    } catch { /* Keep the in-memory cart. */
    }
    emit();
}

if (typeof window !== 'undefined') window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
        snapshot = parseCart(event.key === null ? null : event.newValue);
        emit();
    }
});

export function useCart() {
    return useSyncExternalStore(listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }, () => snapshot);
}

export function addToCart(id: string) {
    if (uuid.test(id) && !snapshot.includes(id) && snapshot.length < 20) save([...snapshot, id]);
}

export function removeFromCart(id: string) {
    save(snapshot.filter(value => value !== id));
}

export function removePurchased(ids: string[]) {
    save(snapshot.filter(id => !ids.includes(id)));
}
