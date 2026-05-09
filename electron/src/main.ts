import { app, BrowserWindow, ipcMain } from "electron";
import { readFile } from "fs/promises";
import { createServer, type Server } from "http";
import net from "net";
import path from "path";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
    ? process.env.DIST
    : path.join(process.env.DIST, "../public");

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

let win: BrowserWindow | null;
let staticServer: Server | null;

const mimeTypes: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".json": "application/json",
    ".map": "application/json",
    ".txt": "text/plain",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
};

// function getErrorMessage(error: unknown, fallback: string): string {
//     if (error instanceof Error && error.message) {
//         return error.message;
//     }

//     return fallback;
// }

const PREFERRED_PORT = 4000;

function registerIpcHandlers(): void {
    ipcMain.handle("api:hello", () => "xd");
}

function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once("error", () => {
            resolve(false);
        });
        server.once("listening", () => {
            server.close(() => {
                resolve(true);
            });
        });
        // Use Node's default binding semantics (matches most dev servers)
        // This avoids false-positives when a port is taken on IPv6/dual-stack.
        server.listen(port);
    });
}

async function findAvailablePort(): Promise<number> {
    for (let offset = 0; offset < 100; offset++) {
        const port = PREFERRED_PORT + offset;
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    throw new Error(
        `Could not find an available port starting from ${PREFERRED_PORT}`,
    );
}

async function startStaticServer(): Promise<string> {
    if (staticServer) {
        const address = staticServer.address();
        if (address && typeof address === "object") {
            return `http://127.0.0.1:${address.port}`;
        }
    }

    const port = await findAvailablePort();
    const root = process.env.DIST!;

    staticServer = createServer(async (req, res) => {
        if (!req.url) {
            res.statusCode = 400;
            res.end();
            return;
        }

        const requestUrl = new URL(req.url, "http://127.0.0.1");
        let pathname = decodeURIComponent(requestUrl.pathname);
        if (pathname === "/") {
            pathname = "/index.html";
        }

        const requestedPath = path.normalize(path.join(root, pathname));
        if (!requestedPath.startsWith(root)) {
            res.statusCode = 403;
            res.end();
            return;
        }

        try {
            const data = await readFile(requestedPath);
            const ext = path.extname(requestedPath).toLowerCase();
            res.setHeader(
                "Content-Type",
                mimeTypes[ext] ?? "application/octet-stream",
            );
            res.end(data);
        } catch {
            try {
                const indexPath = path.join(root, "index.html");
                const html = await readFile(indexPath);
                res.setHeader("Content-Type", "text/html");
                res.end(html);
            } catch {
                res.statusCode = 404;
                res.end("Not found");
            }
        }
    });

    await new Promise<void>((resolve) => {
        staticServer!.listen(port, "127.0.0.1", () => resolve());
    });

    return `http://127.0.0.1:${port}`;
}

async function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC!, "logo.svg"),
        webPreferences: {
            preload: path.join(__dirname, "./preload.js"),
        },
    });

    // Test active push message to Renderer-process.
    win.webContents.on("did-finish-load", () => {
        win?.webContents.send(
            "main-process-message",
            new Date().toLocaleString(),
        );
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        win.webContents.openDevTools();
        hotReloadPreload(win);
    } else {
        win.maximize();
    }

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        const serverUrl = await startStaticServer();
        win.loadURL(serverUrl);
    }
}

function hotReloadPreload(win: BrowserWindow) {
    process.on("message", (msg) => {
        console.log("[electron/main]:", msg);

        if (msg === "electron-vite&type=hot-reload") {
            win.webContents.reload();
        }
    });
}

app.on("window-all-closed", () => {
    app.quit();
    win = null;
});

app.on("before-quit", () => {
    staticServer?.close();
    staticServer = null;
});

app.whenReady().then(() => {
    registerIpcHandlers();
    return createWindow();
});
