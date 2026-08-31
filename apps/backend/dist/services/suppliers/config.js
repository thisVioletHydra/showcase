const supplierAConfig = {
    errorRate: 0.2,
    timeoutRate: 0.1,
    timeoutMs: 5000,
};
const supplierBConfig = {
    errorRate: 0.1,
    timeoutRate: 0.05,
    timeoutMs: 5000,
};
export function getSupplierConfig(supplier) {
    return supplier === 'A' ? { ...supplierAConfig } : { ...supplierBConfig };
}
export function setSupplierConfig(supplier, patch) {
    const target = supplier === 'A' ? supplierAConfig : supplierBConfig;
    if (patch.errorRate !== undefined) {
        target.errorRate = clampRate(patch.errorRate);
    }
    if (patch.timeoutRate !== undefined) {
        target.timeoutRate = clampRate(patch.timeoutRate);
    }
    if (patch.timeoutMs !== undefined) {
        target.timeoutMs = Math.max(100, patch.timeoutMs);
    }
    return { ...target };
}
export function setAllSupplierConfig(patch) {
    return {
        supplierA: setSupplierConfig('A', patch),
        supplierB: setSupplierConfig('B', patch),
    };
}
function clampRate(value) {
    if (value < 0) {
        return 0;
    }
    if (value > 1) {
        return 1;
    }
    return value;
}
export class SupplierTimeoutError extends Error {
    constructor(message = 'Supplier timeout') {
        super(message);
        this.name = 'SupplierTimeoutError';
    }
}
export class SupplierFailureError extends Error {
    reason;
    constructor(reason) {
        super(reason);
        this.name = 'SupplierFailureError';
        this.reason = reason;
    }
}
export function rollSupplierBehavior(config) {
    const roll = Math.random();
    if (roll < config.timeoutRate) {
        return 'timeout';
    }
    if (roll < config.timeoutRate + config.errorRate) {
        return 'error';
    }
    return 'ok';
}
export function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
