import React from 'react';

export const EdgeMarkers: React.FC = () => {
  return (
    <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
      <defs>
        <marker
          id="callisto-arrow"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path d="M 2 2 L 10 6 L 2 10" fill="none" stroke="#334155" strokeWidth="1.6" />
        </marker>

        <marker
          id="callisto-filled-arrow"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path d="M 1 2 L 11 6 L 1 10 z" fill="#334155" />
        </marker>

        <marker
          id="callisto-open-triangle"
          viewBox="0 0 14 14"
          refX="12"
          refY="7"
          markerWidth="11"
          markerHeight="11"
          orient="auto-start-reverse"
        >
          <path d="M 2 2 L 12 7 L 2 12 z" fill="#FFFFFF" stroke="#334155" strokeWidth="1.4" />
        </marker>

        <marker
          id="callisto-filled-diamond"
          viewBox="0 0 16 12"
          refX="14"
          refY="6"
          markerWidth="12"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path d="M 1 6 L 7.5 1.5 L 14 6 L 7.5 10.5 z" fill="#334155" />
        </marker>

        <marker
          id="callisto-open-diamond"
          viewBox="0 0 16 12"
          refX="14"
          refY="6"
          markerWidth="12"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path
            d="M 1 6 L 7.5 1.5 L 14 6 L 7.5 10.5 z"
            fill="#FFFFFF"
            stroke="#334155"
            strokeWidth="1.4"
          />
        </marker>

        <marker
          id="callisto-crows-foot-one"
          viewBox="0 0 14 14"
          refX="12"
          refY="7"
          markerWidth="11"
          markerHeight="11"
          orient="auto-start-reverse"
        >
          <line x1="8" y1="2" x2="8" y2="12" stroke="#334155" strokeWidth="1.6" />
          <line x1="11" y1="2" x2="11" y2="12" stroke="#334155" strokeWidth="1.6" />
        </marker>

        <marker
          id="callisto-crows-foot-many"
          viewBox="0 0 16 14"
          refX="14"
          refY="7"
          markerWidth="12"
          markerHeight="11"
          orient="auto-start-reverse"
        >
          <path d="M 14 2 L 4 7 L 14 12 M 4 2 L 4 12" fill="none" stroke="#334155" strokeWidth="1.5" />
        </marker>

        <marker
          id="callisto-crows-foot-zero-many"
          viewBox="0 0 18 14"
          refX="16"
          refY="7"
          markerWidth="14"
          markerHeight="11"
          orient="auto-start-reverse"
        >
          <circle cx="4" cy="7" r="2.6" fill="#FFFFFF" stroke="#334155" strokeWidth="1.4" />
          <path d="M 16 2 L 8 7 L 16 12" fill="none" stroke="#334155" strokeWidth="1.5" />
        </marker>
      </defs>
    </svg>
  );
};

