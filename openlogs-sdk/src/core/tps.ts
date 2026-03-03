import { TPS } from "@nextera.one/tps-standard";

export function normalizeTpsUri(input: string): string {
  const tps = input?.trim();
  if (!tps) {
    throw new Error("TPS URI is required");
  }

  try {
    const parsed = TPS.parse(tps) as unknown;

    if (typeof parsed === "string") {
      return parsed;
    }

    if (parsed && typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;
      if (typeof p.uri === "string") return p.uri;
      if (typeof p.tps === "string") return p.tps;
      return TPS.toURI(parsed as any);
    }

    throw new Error("Unsupported TPS parse output");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid TPS URI: ${message}`);
  }
}
