import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

const IPC = {
    hello: "api:hello",
    mainProcessMessage: "main-process-message",
} as const;

contextBridge.exposeInMainWorld("api", {
    hello: (): Promise<string> => ipcRenderer.invoke(IPC.hello),

    onMainProcessMessage: (listener: (timestamp: string) => void) => {
        const subscription = (_event: IpcRendererEvent, timestamp: string) =>
            listener(timestamp);
        ipcRenderer.on(IPC.mainProcessMessage, subscription);
        return () => {
            ipcRenderer.removeListener(IPC.mainProcessMessage, subscription);
        };
    },
});
