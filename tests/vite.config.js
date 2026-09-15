import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
export default defineConfig({
    root: fileURLToPath(new URL("./fixture", import.meta.url)),
    envDir: false,
    cacheDir: root + "/.test-output/vite-cache",
    plugins: [vue()],
    resolve: { alias: { "@ds": root + "/index.js", "@internal": root } },
    server: {
        host: "127.0.0.1",
        port: 4179,
        strictPort: true,
        fs: { allow: [root] },
    },
});
