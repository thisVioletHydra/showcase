import type { SupplierConfig } from '../../types';

const supplierAConfig: SupplierConfig = {
  errorRate: 0.2,
  timeoutRate: 0.1,
  timeoutMs: 5000,
};

const supplierBConfig: SupplierConfig = {
  errorRate: 0.1,
  timeoutRate: 0.05,
  timeoutMs: 5000,
};

export function getSupplierConfig(supplier: 'A' | 'B'): SupplierConfig {
  return supplier === 'A' ? { ...supplierAConfig } : { ...supplierBConfig };
}

export function setSupplierConfig(
  supplier: 'A' | 'B',
  patch: Partial<SupplierConfig>,
): SupplierConfig {
  const target = supplier === 'A' ? supplierAConfig : supplierBConfig;

  if (patch.errorRate !== undefined) {
    target.errorRate = clampRate(patch.errorRate);
  }
  if (patch.timeoutRate !== undefined) {
    target.timeoutRate = clampRate(patch.timeoutRate);
  }
  if (patch.timeoutMs !== undefined && Number.isFinite(patch.timeoutMs)) {
    target.timeoutMs = Math.max(100, patch.timeoutMs);
  }

  return { ...target };
}

export function setAllSupplierConfig(patch: Partial<SupplierConfig>): {
  supplierA: SupplierConfig;
  supplierB: SupplierConfig;
} {
  return {
    supplierA: setSupplierConfig('A', patch),
    supplierB: setSupplierConfig('B', patch),
  };
}

function clampRate(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
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
  reason: string;

  constructor(reason: string) {
    super(reason);
    this.name = 'SupplierFailureError';
    this.reason = reason;
  }
}

export function rollSupplierBehavior(config: SupplierConfig): 'ok' | 'error' | 'timeout' {
  const roll = Math.random();

  if (roll < config.timeoutRate) {
    return 'timeout';
  }

  if (roll < config.timeoutRate + config.errorRate) {
    return 'error';
  }

  return 'ok';
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
