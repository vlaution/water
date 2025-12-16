import { useRef, useCallback } from 'react';

/**
 * Hook to synchronize scroll positions across multiple containers.
 * @returns A ref callback to be attached to each scrollable container.
 */
export const useSyncScroll = () => {
    const containersRef = useRef<Set<HTMLElement>>(new Set());
    const isScrollingRef = useRef<boolean>(false);

    const registerContainer = useCallback((node: HTMLElement | null) => {
        if (node) {
            containersRef.current.add(node);
            node.addEventListener('scroll', handleScroll, { passive: true });
        } else {
            // Clean up? Hard to know which one was removed if null is passed.
            // In a real app we might need a Map<ID, Element>.
            // For now, this is a simplified version.
        }
    }, []);

    const handleScroll = (e: Event) => {
        if (isScrollingRef.current) return;

        const target = e.target as HTMLElement;
        const scrollTop = target.scrollTop;

        isScrollingRef.current = true;

        containersRef.current.forEach(container => {
            if (container !== target) {
                container.scrollTop = scrollTop;
            }
        });

        requestAnimationFrame(() => {
            isScrollingRef.current = false;
        });
    };

    // Cleanup on unmount is tricky with the callback ref pattern
    // A more robust implementation would return a RefObject and use useEffect

    return registerContainer;
};
