type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [k: string]: JsonValue };

function normalize(value: unknown): JsonValue {
  if (value === null) return null;

  const t = typeof value;
  if (t === 'string' || t === 'boolean') return value as any;
  if (t === 'number') {
    if (!Number.isFinite(value as number)) {
      throw new Error('Non-finite numbers are not supported in canonical JSON');
    }
    return value as any;
  }

  if (t === 'bigint') {
    throw new Error('BigInt is not supported in canonical JSON');
  }

  if (t === 'undefined' || t === 'function' || t === 'symbol') {
    return null;
  }

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((v) => normalize(v));
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, JsonValue> = {};
    for (const key of Object.keys(obj).sort()) {
      const v = obj[key];
      if (typeof v === 'undefined') continue;
      out[key] = normalize(v);
    }
    return out;
  }

  throw new Error('Unsupported value for canonical JSON');
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(normalize(value));
}
