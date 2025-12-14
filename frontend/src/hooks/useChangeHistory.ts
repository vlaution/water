import { useState, useCallback } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export const useChangeHistory = <T>(initialState: T) => {
    const [state, setState] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: []
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const undo = useCallback(() => {
        setState(currentState => {
            if (currentState.past.length === 0) return currentState;

            const previous = currentState.past[currentState.past.length - 1];
            const newPast = currentState.past.slice(0, currentState.past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [currentState.present, ...currentState.future]
            };
        });
    }, []);

    const redo = useCallback(() => {
        setState(currentState => {
            if (currentState.future.length === 0) return currentState;

            const next = currentState.future[0];
            const newFuture = currentState.future.slice(1);

            return {
                past: [...currentState.past, currentState.present],
                present: next,
                future: newFuture
            };
        });
    }, []);

    const pushState = useCallback((newState: T) => {
        setState(currentState => {
            // Don't push if state hasn't changed (deep comparison might be expensive, so we rely on ref equality or simple check)
            if (JSON.stringify(currentState.present) === JSON.stringify(newState)) {
                return currentState;
            }

            return {
                past: [...currentState.past, currentState.present],
                present: newState,
                future: [] // Clear future on new change
            };
        });
    }, []);

    // Helper to reset history (e.g., on form load)
    const resetHistory = useCallback((newState: T) => {
        setState({
            past: [],
            present: newState,
            future: []
        });
    }, []);

    return {
        state: state.present,
        pushState,
        undo,
        redo,
        canUndo,
        canRedo,
        resetHistory
    };
};
