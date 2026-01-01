
import React, { useMemo, useState, useRef, useEffect } from 'react';

interface PreviewFrameProps {
  html: string;
  css: string;
  width?: number; // Target width (e.g., 1440 or 375)
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({ html, css, width = 1440 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentWidth, setCurrentWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(600);
  const lastHeightRef = useRef(600);

  // Sync the container width with the actual DOM size to calculate scaling
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use Math.floor to avoid sub-pixel jitter during layout reflows
        const w = Math.floor(entry.contentRect.width);
        if (w !== currentWidth) {
          setCurrentWidth(w);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [currentWidth]);

  // Listen for messages from the iframe to update height safely
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'preview-height-update') {
        const height = event.data.height;
        if (typeof height === 'number' && height > 0) {
          // Prevent micro-oscillations by checking threshold.
          // Increased threshold slightly and using Math.ceil for stability.
          if (Math.abs(lastHeightRef.current - height) > 2) {
            lastHeightRef.current = height;
            setContentHeight(Math.ceil(height));
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const srcDoc = useMemo(() => `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* Base Styles for the Preview Context */
          html { 
            margin: 0; 
            padding: 0; 
            background-color: #ffffff; 
            width: ${width}px;
            overflow: hidden; 
          }
          body { 
            margin: 0; 
            padding: 0; 
            width: ${width}px;
            font-family: system-ui, -apple-system, sans-serif;
            overflow: hidden;
            background: transparent;
            min-height: 100vh;
          }
          img { max-width: 100%; height: auto; display: block; }
          
          /* User Template CSS */
          ${css}

          /* PREVIEW OVERRIDES: Ensuring all content is visible for measurement */
          #preview-mount {
            width: 100%;
            display: flow-root;
            overflow: visible;
          }

          /* Force sections to expand to their content so we can measure the 'true' height */
          #preview-mount > header,
          #preview-mount > section,
          #preview-mount > footer {
            height: auto !important;
            min-height: min-content !important;
            overflow: visible !important;
          }
          
          .container { width: 100%; max-width: ${width}px; box-sizing: border-box; }
        </style>
      </head>
      <body>
        <div id="preview-mount">${html}</div>
        <script>
          const mount = document.getElementById('preview-mount');
          let frameId = null;

          const reportHeight = () => {
            if (frameId) cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
              // Measure the full vertical extent of the mount point using getBoundingClientRect
              // which is more precise than scrollHeight for scaled contexts
              const height = mount.getBoundingClientRect().height;
              window.parent.postMessage({ type: 'preview-height-update', height }, '*');
            });
          };

          // Monitor for internal layout shifts
          const ro = new ResizeObserver(reportHeight);
          ro.observe(mount);

          // Standard events to catch lazy images or font loads
          window.addEventListener('load', reportHeight);
          
          // Initial report
          setTimeout(reportHeight, 100);
          
          // Fallback interval for complex dynamic layouts
          setInterval(reportHeight, 1000);
        </script>
      </body>
    </html>
  `, [html, css, width]);

  const scale = currentWidth > 0 ? Math.min(currentWidth / width, 1) : 1;
  const scaledHeight = Math.ceil(contentHeight * scale);

  return (
    <div
      ref={containerRef}
      className="relative w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mx-auto"
      style={{ height: `${scaledHeight}px`, maxWidth: `${width}px` }}
    >
      <div
        className="origin-top-left"
        style={{
          width: `${width}px`,
          height: `${contentHeight}px`,
          transform: `scale(${scale})`,
        }}
      >
        <iframe
          title="Preview Window"
          className="w-full h-full border-none pointer-events-none"
          srcDoc={srcDoc}
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
};

export default PreviewFrame;
