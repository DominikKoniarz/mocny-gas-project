import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourceAlias = {
    "@": path.resolve(__dirname, "./src"),
};

const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
);
const appVersion = packageJson.version;

export default defineConfig({
    plugins: [
        electron({
            main: {
                entry: "src/main.ts",
                vite: {
                    build: {
                        outDir: "dist-electron",
                    },
                    resolve: {
                        alias: sourceAlias,
                    },
                },
            },
            preload: {
                input: "src/preload.ts",
                vite: {
                    build: {
                        outDir: "dist-electron",
                    },
                    resolve: {
                        alias: sourceAlias,
                    },
                },
            },
        }),
        tailwindcss(),
        react(),
    ],
    resolve: {
        alias: sourceAlias,
    },
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
    },
});
