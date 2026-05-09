import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type {
    CheckForUpdateResult,
    InstallUpdateResult,
    UpdateStatus,
} from "./updater/types";

const IPC = {
    hello: "api:hello",
    mainProcessMessage: "main-process-message",
    updateCheck: "update:check",
    updateDownloadAndInstall: "update:download-and-install",
    updateGetStatus: "update:get-status",
    updateStatus: "update:status",
} as const;

contextBridge.exposeInMainWorld("api", {
    hello: (): Promise<string> => ipcRenderer.invoke(IPC.hello),
    checkForUpdate: (): Promise<CheckForUpdateResult> =>
        ipcRenderer.invoke(IPC.updateCheck),
    downloadAndInstallUpdate: (): Promise<InstallUpdateResult> =>
        ipcRenderer.invoke(IPC.updateDownloadAndInstall),
    getUpdateStatus: (): Promise<UpdateStatus> =>
        ipcRenderer.invoke(IPC.updateGetStatus),
    onUpdateStatus: (listener: (status: UpdateStatus) => void) => {
        const subscription = (_event: IpcRendererEvent, status: UpdateStatus) =>
            listener(status);
        ipcRenderer.on(IPC.updateStatus, subscription);
        return () => {
            ipcRenderer.removeListener(IPC.updateStatus, subscription);
        };
    },

    onMainProcessMessage: (listener: (timestamp: string) => void) => {
        const subscription = (_event: IpcRendererEvent, timestamp: string) =>
            listener(timestamp);
        ipcRenderer.on(IPC.mainProcessMessage, subscription);
        return () => {
            ipcRenderer.removeListener(IPC.mainProcessMessage, subscription);
        };
    },
});
