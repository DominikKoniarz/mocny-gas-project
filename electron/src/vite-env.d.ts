/// <reference types="vite/client" />

import type {
    CheckForUpdateResult,
    InstallUpdateResult,
    UpdateStatus,
} from "./updater/types";

interface ImportMetaEnv {
    readonly VITE_SERVER_URL?: string;
    readonly VITE_APP_MODE?: "1" | "2" | "3" | "4";
}

// Extend ImportMeta to include env property
/* eslint-disable-next-line */
interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare global {
    // Global constants defined in vite.config.mts
    const __APP_VERSION__: string;

    interface Window {
        api: {
            hello: () => Promise<string>;
            checkForUpdate: () => Promise<CheckForUpdateResult>;
            downloadAndInstallUpdate: () => Promise<InstallUpdateResult>;
            getUpdateStatus: () => Promise<UpdateStatus>;
            onUpdateStatus: (
                listener: (status: UpdateStatus) => void,
            ) => () => void;
            onMainProcessMessage: (
                listener: (timestamp: string) => void,
            ) => () => void;
        };
    }
}

export {};
