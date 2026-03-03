import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/core/index.ts", "src/v1.ts", "src/keys.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
