// Connection status hook for offline support
import { useState, useEffect, useCallback } from "react";

interface QueuedAction {
    id: string;
    type: string;
    data: unknown;
    timestamp: number;
}

interface ConnectionState {
    isOnline: boolean;
    wasOffline: boolean;
    queuedActions: QueuedAction[];
    lastSyncTime: Date | null;
}

export function useConnection() {
    const [state, setState] = useState<ConnectionState>({
        isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
        wasOffline: false,
        queuedActions: [],
        lastSyncTime: null,
    });

    useEffect(() => {
        // Load queued actions from localStorage
        const saved = localStorage.getItem("queuedActions");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState((prev) => ({ ...prev, queuedActions: parsed }));
            } catch (e) {
                console.error("Failed to parse queued actions", e);
            }
        }

        const handleOnline = () => {
            setState((prev) => ({
                ...prev,
                isOnline: true,
                wasOffline: true,
            }));
        };

        const handleOffline = () => {
            setState((prev) => ({
                ...prev,
                isOnline: false,
            }));
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const queueAction = useCallback((type: string, data: unknown) => {
        const action: QueuedAction = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: Date.now(),
        };

        setState((prev) => {
            const newQueue = [...prev.queuedActions, action];
            localStorage.setItem("queuedActions", JSON.stringify(newQueue));
            return { ...prev, queuedActions: newQueue };
        });

        return action.id;
    }, []);

    const clearQueue = useCallback(() => {
        localStorage.removeItem("queuedActions");
        setState((prev) => ({
            ...prev,
            queuedActions: [],
            lastSyncTime: new Date(),
            wasOffline: false,
        }));
    }, []);

    const syncActions = useCallback(async () => {
        if (state.queuedActions.length === 0) return;

        // Process queued actions (in real app, would send to server)
        console.log("Syncing queued actions:", state.queuedActions);

        // Simulate sync delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        clearQueue();
    }, [state.queuedActions, clearQueue]);

    // Auto-sync when coming back online
    useEffect(() => {
        if (state.isOnline && state.wasOffline && state.queuedActions.length > 0) {
            syncActions();
        }
    }, [state.isOnline, state.wasOffline, state.queuedActions.length, syncActions]);

    return {
        ...state,
        queueAction,
        clearQueue,
        syncActions,
    };
}
