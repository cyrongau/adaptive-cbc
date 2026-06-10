'use client';

import React, { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';

export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

export default function HtmlContent({ html, className = '', renderMath = false }: { html?: string; className?: string; renderMath?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!renderMath || !containerRef.current || !html) return;
    try {
      renderMathInElement(containerRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
      });
    } catch {
      console.warn('KaTeX auto-render failed');
    }
  }, [html, renderMath]);

  if (!html) return null;
  return <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
