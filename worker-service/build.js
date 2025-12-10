const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist", { recursive: true });
}

// Build configuration
esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    outfile: "dist/index.js",
    // Exclude native modules (sharp) and any other native addons from bundling.
    // Keep them as runtime `require()` so native .node binaries load correctly.
    external: ["sharp"],
    minify: true,
    sourcemap: true,
  })
  .then(() => {
    console.log("✅ Build completed successfully!");
    console.log("📦 Bundled server: dist/index.js");
  })
  .catch((error) => {
    console.error("❌ Build failed:", error);
    process.exit(1);
  });
