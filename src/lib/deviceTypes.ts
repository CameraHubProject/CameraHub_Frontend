export const deviceTypes = ['BODY', 'BODY_LENS', 'LENS', 'OTHER'] as const;
export type DeviceType = typeof deviceTypes[number];
export const deviceTypeLabels: Record<DeviceType, string> = {
    BODY: 'Body',
    BODY_LENS: 'Body + lens',
    LENS: 'Lens',
    OTHER: 'Phụ kiện',
};
