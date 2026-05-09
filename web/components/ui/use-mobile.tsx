import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

const subscribe = (callback: () => void) => {
    const mql = window.matchMedia(MEDIA_QUERY);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
};

const getSnapshot = () => window.innerWidth < MOBILE_BREAKPOINT;
const getServerSnapshot = () => false;

export function useIsMobile() {
    return React.useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );
}
