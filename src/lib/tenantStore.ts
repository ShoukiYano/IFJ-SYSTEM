import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantStore {
    tenantId: string;
    userId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getTenantId() {
    return tenantStorage.getStore()?.tenantId;
}

export function getUserId() {
    return tenantStorage.getStore()?.userId;
}
