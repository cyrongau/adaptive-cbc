'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import 'katex/dist/katex.min.css';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link', 'image', 'formula'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  },
};

export function processHtmlForFormulas(html: string): string {
  if (!html) return html;

  let processed = html.replace(/\$\$(.*?)\$\$/g, (_match, p1) => {
    const unescaped = p1.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
    const escapedAttr = unescaped.replace(/"/g, '&quot;');
    return `<span class="ql-formula" data-value="${escapedAttr}"></span>`;
  });

  processed = processed.replace(/\\\((.*?)\\\)/g, (_match, p1) => {
    const unescaped = p1.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
    const escapedAttr = unescaped.replace(/"/g, '&quot;');
    return `<span class="ql-formula" data-value="${escapedAttr}"></span>`;
  });

  return processed;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 120,
  label,
  processFormulas = true,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
  label?: string;
  processFormulas?: boolean;
}) {
  const [Quill, setQuill] = useState<React.ComponentType<any> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const katexReady = useRef(false);

  useEffect(() => {
    Promise.all([
      import('react-quill'),
      import('katex'),
    ])
      .then(([quillMod, katexMod]) => {
        const katex = katexMod.default || katexMod;
        (window as any).katex = katex;
        katexReady.current = true;

        const QuillComponent = quillMod.default || quillMod;
        const DynamicQuill = dynamic(() => Promise.resolve(QuillComponent), { ssr: false });
        setQuill(() => DynamicQuill);
      })
      .catch(() => setLoadError(true));
  }, []);

  const handleChange = (val: string) => {
    onChange(processFormulas ? processHtmlForFormulas(val) : val);
  };

  if (loadError) {
    return (
      <div>
        {label && <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>}
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || 'Enter content...'}
          className="w-full border border-slate-200 rounded-xl p-4 font-sans text-sm focus:outline-none focus:border-[#47a263]"
          style={{ minHeight: `${minHeight}px` }}
        />
      </div>
    );
  }

  if (!Quill) {
    return (
      <div>
        {label && <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>}
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-400" style={{ minHeight: `${minHeight}px` }}>
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-slate-700">{label}</label>
          <a href="/support" target="_blank" className="text-xs text-slate-400 hover:text-[#47a263] transition-colors" title="Open editor guide">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          </a>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 focus-within:border-[#47a263] focus-within:ring-1 focus-within:ring-[#47a263] quill-wrapper" style={{ overflow: 'visible', minHeight: `${minHeight + 80}px` }}>
        <style dangerouslySetInnerHTML={{__html: `
          .quill-wrapper { overflow: visible !important; }
          .quill-wrapper .ql-toolbar { border: none; border-bottom: 1px solid #e2e8f0; background: #f8fafc; border-radius: 0.75rem 0.75rem 0 0; position: relative; }
          .quill-wrapper .ql-container { border: none; font-family: inherit; font-size: 1rem; }
          .quill-wrapper .ql-editor { min-height: ${minHeight}px; padding: 1rem; }
          .quill-wrapper .ql-formula { cursor: pointer; padding: 0 2px; }
          .quill-wrapper strong { font-weight: bold; }
          .quill-wrapper em { font-style: italic; }
          .quill-wrapper u { text-decoration: underline; }
          .quill-wrapper s { text-decoration: line-through; }
          .ql-formula-prompt { position: absolute !important; top: 100% !important; left: 0 !important; right: 0 !important; z-index: 1000 !important; background: white; padding: 12px; border: 1px solid #e2e8f0; border-radius: 0 0 0.75rem 0.75rem; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
          .ql-formula-prompt input { display: block; min-height: 40px; font-size: 14px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; width: 100%; box-sizing: border-box; outline: none; }
          .ql-formula-prompt input:focus { border-color: #47a263; box-shadow: 0 0 0 3px rgba(71,162,99,0.15); }
          .ql-formula-prompt button { margin-top: 8px; padding: 8px 20px; background: #47a263; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; }
          .ql-formula-prompt button:hover { background: #3d8b55; }
        `}} />
        <Quill
          theme="snow"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          modules={quillModules}
        />
      </div>
    </div>
  );
}
