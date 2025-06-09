// lib/useScrollToTop.ts
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [pathname]);

    // Also scroll on initial mount
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'instant' as ScrollBehavior
        });
    }, []);
}