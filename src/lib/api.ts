export interface Health {
  status: 'UP';
  service: 'CameraHub';
  moneyMode: 'SIMULATED';
}

export async function fetchHealth(): Promise<Health> {
  const response = await fetch('/api/health', { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error('Không thể kết nối máy chủ.');
  const data: unknown = await response.json();
  if (typeof data !== 'object' || data === null ||
      !('status' in data) || data.status !== 'UP' ||
      !('service' in data) || data.service !== 'CameraHub' ||
      !('moneyMode' in data) || data.moneyMode !== 'SIMULATED') {
    throw new Error('Phản hồi máy chủ không hợp lệ.');
  }
  return data as Health;
}
