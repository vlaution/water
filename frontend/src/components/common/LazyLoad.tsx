import React from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { SkeletonCard } from '../dashboard/SkeletonCard';

interface LazyLoadProps {
    children: React.ReactNode;
    placeholder?: React.ReactNode;
    className?: string;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
    children,
    placeholder = <SkeletonCard height="h-64" />,
    className = ""
}) => {
    const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });

    return (
        <div ref={elementRef} className={className}>
            {isVisible ? children : placeholder}
        </div>
    );
};
