import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import type { ESLint } from "eslint";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";

const tsPlugin = ts as unknown as ESLint.Plugin;
const reactHooksPlugin = reactHooks as unknown as ESLint.Plugin;

export default defineConfig([
    js.configs.recommended,
    {
        files: ["**/*.mjs", "**/*.cjs"],
        languageOptions: {
            globals: {
                console: "readonly",
                process: "readonly",
                require: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
            },
        },
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
            globals: {
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                Navigator: "readonly",
                localStorage: "readonly",
                sessionStorage: "readonly",
                fetch: "readonly",
                WebSocket: "readonly",
                File: "readonly",
                FileList: "readonly",
                FileReader: "readonly",
                Blob: "readonly",
                atob: "readonly",
                crypto: "readonly",
                prompt: "readonly",
                confirm: "readonly",
                getComputedStyle: "readonly",
                requestAnimationFrame: "readonly",
                HTMLElement: "readonly",
                HTMLInputElement: "readonly",
                HTMLDivElement: "readonly",
                HTMLButtonElement: "readonly",
                HTMLSpanElement: "readonly",
                HTMLTextAreaElement: "readonly",
                HTMLHeadingElement: "readonly",
                HTMLParagraphElement: "readonly",
                HTMLImageElement: "readonly",
                Element: "readonly",
                Event: "readonly",
                KeyboardEvent: "readonly",
                DragEvent: "readonly",
                PointerEvent: "readonly",
                CustomEvent: "readonly",
                ClipboardEvent: "readonly",
                WheelEvent: "readonly",
                DataTransfer: "readonly",
                ResizeObserver: "readonly",
                AbortSignal: "readonly",
                Audio: "readonly",
                ScrollBehavior: "readonly",
                URL: "readonly",
                URLSearchParams: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearTimeout: "readonly",
                clearInterval: "readonly",
                process: "readonly",
                require: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                NodeJS: "readonly",
                React: "readonly",
                JSX: "readonly",
                Electron: "readonly",
                __APP_VERSION__: "readonly",
                console: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            "react-hooks": reactHooksPlugin,
        },
        rules: {
            ...ts.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    globalIgnores([
        "dist/**",
        "dist-electron/**",
        "node_modules/**",
        "release/**",
        "src/routeTree.gen.ts",
    ]),
]);
