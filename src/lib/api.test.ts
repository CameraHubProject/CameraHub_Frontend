import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchHealth } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('backend health contract', () => {
  it('accepts a simulated healthy backend', async () => {
    const data = { status: 'UP', service: 'CameraHub', moneyMode: 'SIMULATED' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(data)));
    await expect(fetchHealth()).resolves.toEqual(data);
  });
  it('rejects unavailable backends', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(fetchHealth()).rejects.toThrow('Không thể kết nối máy chủ.');
  });
  it('does not claim readiness for an invalid or empty payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({})));
    await expect(fetchHealth()).rejects.toThrow('Phản hồi máy chủ không hợp lệ.');
  });
});
