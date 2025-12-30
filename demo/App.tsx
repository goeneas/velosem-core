import React from 'react';
import {
  templates,
  PreviewFrame,
  TemplateCard,
  useTemplateEditor,
  COMMON_CSS_BASE,
  ConfirmationModal
} from '@velosem/core';
import { useSavedPages } from './hooks/useSavedPages';


type ViewTab = 'content' | 'styles' | 'export';

/**
 * A simple, performant syntax highlighter using regex to match the visual reference.
 */
const SyntaxHighlighter: React.FC<{ code: string; lang: 'html' | 'css' }> = ({ code, lang }) => {
  const highlighted = React.useMemo(() => {
    if (lang === 'html') {
      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Comments: green
        .replace(/(&lt;!--.*?--&gt;)/gs, '<span class="text-[#008000]">$1</span>')
        // Tags: blue/purple
        .replace(/(&lt;\/?[a-z0-9]+)(.*?)(\/?&gt;)/gi, (match, p1, p2, p3) => {
          const tag = `<span class="text-[#000080] font-bold">${p1}</span>`;
          const closing = `<span class="text-[#000080] font-bold">${p3}</span>`;
          // Attributes: red
          // Attribute values: blue
          const attrs = p2.replace(/([a-z0-9-]+)(=)("[^"]*"|'[^']*'|[^\s>]+)/gi,
            '<span class="text-[#ff0000]">$1</span><span class="text-black">$2</span><span class="text-[#0000ff]">$3</span>'
          );
          return tag + attrs + closing;
        });
    } else {
      // CSS Highlighting
      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Comments: green
        .replace(/(\/\*.*?\*\/)/gs, '<span class="text-[#008000]">$1</span>')
        // Selectors: bold indigo
        .replace(/([^{}]+)(?=\{)/g, '<span class="text-[#000080] font-bold">$1</span>')
        // Properties: red
        .replace(/([a-z-]+)(?=\s*:)/gi, '<span class="text-[#ff0000]">$1</span>')
        // Values: blue
        .replace(/(:\s*)([^;{}]+)(;?)/g, '$1<span class="text-[#0000ff]">$2</span>$3');
    }
  }, [code, lang]);

  return (
    <pre
      className="p-8 bg-white text-slate-800 rounded-3xl overflow-auto text-[13px] font-mono border border-slate-200 shadow-sm h-full leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
};

const App: React.FC = () => {
  const editor = useTemplateEditor();
  const {
    sections,
    activeId,
    activeSection,
    activeTemplate,
    fieldModes,
    linkPopup,
    setActiveId,
    addSection,
    moveSection,
    removeSection,
    clearAllSections,
    handleFieldChange,
    updateSectionStatus, // Destructured
    toggleFieldMode,
    openLinkPopup,
    closeLinkPopup,
    handleLinkConfirm,
    generateFullHtml,
    generateSanitizedHtml,
    generateFinalCss,
    generateBundle,
    beautifyHtml,
    loadSections
  } = editor;

  const { savedPages, savePage, updatePageMeta, updatePageContent, deletePage, importPages } = useSavedPages();
  const [saveTitle, setSaveTitle] = React.useState('');
  const [saveNote, setSaveNote] = React.useState('');

  // Modal State
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    action?: () => void;
  }>({ isOpen: false, title: '', message: '' });

  // Page Title State
  const [pageTitle, setPageTitle] = React.useState('Untitled');
  const [activePageId, setActivePageId] = React.useState<string | null>(null);

  // View state (local to App, or we could use the hook's activeTab if meant for this)
  // The hook has 'activeTab' but it seems to be 'content' | 'styles' | 'export'.
  // The original App had 'reference' | 'editor' | 'preview-desktop' | 'preview-mobile' | 'html-output'
  // Let's adapt to a hybrid approach or stick to the hook's tabs to fully embrace "Agent Manager" mode.
  // Actually, checking the hook code again: activeTab is 'content' | 'styles' | 'export'.
  // But for the main view we probably still want the "Desktop/Mobile" toggles.
  // Let's create a local state for the Viewport Mode.

  const [viewportMode, setViewportMode] = React.useState<'desktop' | 'mobile'>('desktop');
  const [appTab, setAppTab] = React.useState<'editor' | 'preview' | 'export' | 'saved'>('editor');

  // Accordion state
  const [activeGroupIndex, setActiveGroupIndex] = React.useState(-1);

  // Reset accordion when switching sections
  React.useEffect(() => {
    setActiveGroupIndex(-1);
  }, [activeId]);

  // Ref to store selection for link insertion
  const savedSelection = React.useRef<{
    type: 'visual' | 'code';
    range?: Range;
    start?: number;
    end?: number;
    fieldId: string;
  } | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const applyFormatting = (fieldId: string, type: 'bold' | 'italic' | 'ul' | 'ol' | 'link' | 'clean' | 'h2' | 'h3' | 'p') => {
    const fieldKey = fieldId; // In hook, fieldModes is keyed by fieldId (check hook logic... wait, hook uses id directly?)
    // Hook: toggleFieldMode(id) -> setFieldModes... [id]: ...
    // But in original App, keys were `${ activeId } -${ fieldId } `.
    // In the hook, `fieldModes` is `Record < string, ...> `. 
    // Let's check `toggleFieldMode` implementation in hook.
    // `const toggleFieldMode = useCallback((id: string) => { setFieldModes(prev => ({ ...prev, [id]: ... })) }, []); `
    // So it expects a unique ID. Since fields are per section, we should probably use `${ activeId } -${ fieldId } ` key convention if the hook doesn't enforce it, 
    // OR just `fieldId` if the hook resets modes on section switch. 
    // The hook state `fieldModes` is global. So we MUST use a unique key.
    // Let's use `${ activeId } -${ fieldId } `.

    const modeKey = `${activeId}-${fieldId}`;
    const fieldObj = activeTemplate.fields.find(f => f.id === fieldId);
    if (!fieldObj) return;

    // Note: hook has `toggleFieldMode` but here we need to READ the mode.
    // The hook exposes `fieldModes`.
    // The hook `toggleFieldMode` takes an `id`. 
    // We should probably invoke `editor.toggleFieldMode(modeKey)` when clicking the Visual/Code buttons.

    const currentMode = fieldModes[modeKey] || (fieldObj.type === 'textarea' && !fieldObj.label.toLowerCase().includes('title') ? 'visual' : 'code');
    const isRich = currentMode === 'visual';

    if (type === 'link') {
      const modeKey = `${activeId}-${fieldId}`;
      const fieldObj = activeTemplate.fields.find(f => f.id === fieldId);
      if (!fieldObj) return;

      const currentMode = fieldModes[modeKey] || (fieldObj.type === 'textarea' && !fieldObj.label.toLowerCase().includes('title') ? 'visual' : 'code');
      const isRich = currentMode === 'visual';

      // Capture selection before opening popup
      if (isRich) {
        // Visual Mode: Create a temporary link immediately to persist through blur/focus changes
        // This avoids the issue where React re-renders invalidate the Selection Range
        document.execCommand('createLink', false, 'https://velosem-temp-link');

        // Force update state immediately so the temp link is saved
        const el = document.getElementById(`field-${fieldId}`);
        if (el) handleFieldChange(fieldId, el.innerHTML);

        savedSelection.current = {
          type: 'visual',
          fieldId // We don't need the range anymore
        };
      } else {
        const textarea = document.getElementById(`field-${fieldId}`) as HTMLTextAreaElement;
        if (textarea) {
          savedSelection.current = {
            type: 'code',
            start: textarea.selectionStart,
            end: textarea.selectionEnd,
            fieldId
          };
        }
      }

      openLinkPopup(fieldId);
      return;
    }

    if (isRich) {
      if (type === 'ul') document.execCommand('insertUnorderedList', false);
      if (type === 'ol') document.execCommand('insertOrderedList', false);
      if (type === 'bold') document.execCommand('bold', false);
      if (type === 'italic') document.execCommand('italic', false);
      if (type === 'clean') {
        document.execCommand('removeFormat', false, null);
        // Also strip specific tags if needed, but removeFormat is a good start
      }
      if (type === 'h2') document.execCommand('formatBlock', false, '<h2>');
      if (type === 'h3') document.execCommand('formatBlock', false, '<h3>');
      if (type === 'p') document.execCommand('formatBlock', false, '<p>');

      // Sync change
      const el = document.getElementById(`field-${fieldId}`);
      if (el) handleFieldChange(fieldId, el.innerHTML);
    } else {
      const textarea = document.getElementById(`field-${fieldId}`) as HTMLTextAreaElement;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);

      let replacement = '';
      if (type === 'ul' || type === 'ol') {
        const items = selectedText
          ? selectedText.split('\n').filter(Boolean).map(s => `<li>${s}</li>`).join('\n')
          : '<li>item</li>';
        const tag = type === 'ul' ? 'ul' : 'ol';
        replacement = `<${tag}>\n${items}\n</${tag}>`;
      } else {
        replacement = type === 'bold' ? `<strong>${selectedText || 'text'}</strong>` : `<em>${selectedText || 'text'}</em>`;
      }

      const newValue = text.substring(0, start) + replacement + text.substring(end);
      handleFieldChange(fieldId, newValue);
    }
  };

  // Construct the CSS for the current view
  const activeSectionCss = React.useMemo(() => {
    return `${COMMON_CSS_BASE} \n${activeTemplate?.css || ''} `;
  }, [activeTemplate]);

  // Construct the Full Page CSS
  const fullPageCss = React.useMemo(() => {
    // We need to gather all CSS from used templates
    const usedIds = Array.from(new Set(sections.map(s => s.templateId)));
    const css = usedIds.map(id => templates.find(t => t.id === id)?.css || '').join('\n');
    return `${COMMON_CSS_BASE} \n${css} `;
  }, [sections]);

  const rawHtml = React.useMemo(() => activeTemplate ? activeTemplate.renderHtml(activeSection.values) : '', [activeTemplate, activeSection]);

  const renderEditor = () => {
    if (!activeTemplate || !activeSection) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 animate-in fade-in duration-300">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wide">Ready to Build</h3>
          <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">Your page is currently empty. Select a template from the <strong className="text-slate-700">LIBRARY</strong> on the left to get started.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-300">
        {/* FIELDS COLUMN */}
        <div className="space-y-10">
          {/* SAVE / UPDATE BLOCK */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-[#f14924] uppercase tracking-widest mb-1">
                  {activePageId ? 'EDITING SAVED PAGE' : 'UNSAVED DRAFT'}
                </h4>
                <p className="text-sm font-bold text-white truncate pr-2">
                  {activePageId ? `Update "${savedPages.find(p => p.id === activePageId)?.title || pageTitle}"?` : 'Save this layout to your library?'}
                </p>
              </div>

              {activePageId ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Update Note..."
                    className="w-40 bg-slate-800 border-none rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-[#f14924] transition-all text-white placeholder-slate-500"
                    value={saveNote}
                    onChange={e => setSaveNote(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      const currentTitle = savedPages.find(p => p.id === activePageId)?.title || pageTitle;
                      updatePageMeta(activePageId, currentTitle, saveNote);
                      updatePageContent(activePageId, sections);
                      alert('Page Updated!');
                    }}
                    className="px-5 py-2.5 bg-[#f14924] hover:bg-[#d13d1a] text-white text-xs font-black uppercase rounded-xl transition-all shadow-lg hover:shadow-[#f14924]/20 flex items-center gap-2"
                  >
                    <span>Update Page</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Page Name..."
                    className="w-32 bg-slate-800 border-none rounded-lg px-3 text-xs focus:ring-1 focus:ring-[#f14924] transition-all"
                    value={saveTitle}
                    onChange={e => setSaveTitle(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (!saveTitle) return alert('Please enter a title');
                      const newId = savePage(saveTitle, '', sections);
                      setActivePageId(newId);
                      setPageTitle(saveTitle);
                      setSaveTitle('');
                      alert('Page Saved!');
                    }}
                    className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 text-xs font-black uppercase rounded-xl transition-colors"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{activeTemplate.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">{activeSection.uId.split('-')[0]}</p>

            </div>


          </div>

          {(() => {
            // 1. Group Logic: Consolidate ungrouped fields into 'General'
            const groupedFields: { name: string; fields: typeof activeTemplate.fields }[] = [];

            let generalGroup: typeof activeTemplate.fields = [];
            let currentNamedGroup: { name: string; fields: typeof activeTemplate.fields } | null = null;

            activeTemplate.fields.forEach(field => {
              if (field.group) {
                if (currentNamedGroup && currentNamedGroup.name === field.group) {
                  currentNamedGroup.fields.push(field);
                } else {
                  if (currentNamedGroup) groupedFields.push(currentNamedGroup);
                  currentNamedGroup = { name: field.group, fields: [field] };
                }
              } else {
                // Ungrouped -> Collect for General
                if (currentNamedGroup) {
                  groupedFields.push(currentNamedGroup);
                  currentNamedGroup = null;
                }
                generalGroup.push(field);
              }
            });

            if (currentNamedGroup) groupedFields.push(currentNamedGroup);

            // Prepend General Group if exists
            if (generalGroup.length > 0) {
              groupedFields.unshift({ name: 'General', fields: generalGroup });
            }

            // 2. Render Accordion
            return groupedFields.map((group, groupIdx) => {
              const isActive = activeGroupIndex === groupIdx;

              // Check if any field in this group is modified
              const isGroupModified = group.fields.some(field => {
                const current = activeSection.values[field.id];
                const def = field.defaultValue;
                return current !== def;
              });

              return (
                <div key={groupIdx} className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isActive ? 'border-slate-300 shadow-md ring-1 ring-slate-200' : 'border-slate-100 hover:border-slate-200'}`}>

                  {/* Accordion Header */}
                  <button
                    onClick={() => setActiveGroupIndex(isActive ? -1 : groupIdx)}
                    className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors text-left"
                  >
                    <h4 className={`text-xs font-black uppercase tracking-[0.15em] ${isActive ? 'text-[#f14924]' : (isGroupModified ? 'text-emerald-600' : 'text-slate-500')}`}>
                      {group.name}
                    </h4>
                    <div className={`transform transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </button>

                  {/* Accordion Body */}
                  <div
                    className={`border-t border-slate-100 bg-slate-50/30 transition-all duration-300 ease-in-out ${isActive ? 'max-h-[15000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
                  >
                    <div className="p-6 space-y-8">

                      {group.fields.map((field) => {
                        const modeKey = `${activeId}-${field.id}`;
                        const isTitle = field.label.toLowerCase().includes('title') || field.label.toLowerCase().includes('heading');
                        const mode = fieldModes[modeKey] || (field.type === 'textarea' && !isTitle ? 'visual' : 'code');
                        const isRich = mode === 'visual';

                        return (
                          <div key={field.id} className="space-y-3">
                            {/* Sticky Header Wrapper */}
                            <div className="sticky top-[74px] z-20 bg-[#F9FBFC]/95 backdrop-blur-sm -mx-6 px-6 py-2 border-b border-transparent transition-all">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{field.label}</label>
                                {field.type === 'textarea' && (
                                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg scale-90 origin-right">
                                    <button onClick={() => toggleFieldMode(modeKey)} className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${isRich ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>VISUAL</button>
                                    <button onClick={() => toggleFieldMode(modeKey)} className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${!isRich ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>CODE</button>
                                  </div>
                                )}
                              </div>

                              {/* Toolbar for Textarea */}
                              {field.type === 'textarea' && isRich && (
                                <div className="flex flex-wrap gap-1 mt-2 bg-white border border-slate-200 rounded-lg p-1 w-fit shadow-sm">
                                  <button onMouseDown={e => { e.preventDefault(); applyFormatting(field.id, 'bold'); }} className="p-2 hover:bg-slate-100 rounded text-slate-600 font-bold text-xs" title="Bold">B</button>
                                  <button onMouseDown={e => { e.preventDefault(); applyFormatting(field.id, 'italic'); }} className="p-2 hover:bg-slate-100 rounded text-slate-600 italic text-xs" title="Italic">I</button>
                                  <div className="w-px bg-slate-200 my-1 mx-1"></div>
                                  <button onMouseDown={e => { e.preventDefault(); applyFormatting(field.id, 'h2'); }} className="p-2 hover:bg-slate-100 rounded text-slate-600 font-bold text-xs" title="Heading 2">H2</button>
                                  <button onMouseDown={e => { e.preventDefault(); applyFormatting(field.id, 'h3'); }} className="p-2 hover:bg-slate-100 rounded text-slate-600 font-bold text-xs" title="Heading 3">H3</button>
                                  <button onMouseDown={e => { e.preventDefault(); applyFormatting(field.id, 'p'); }} className="p-2 hover:bg-slate-100 rounded text-slate-600 font-medium text-xs" title="Paragraph">¶</button>
                                  <div className="w-px bg-slate-200 my-1 mx-1"></div>
                                  <button onMouseDown={e => { e.preventDefault(); applyFormatting(field.id, 'link'); }} className="p-2 hover:bg-slate-100 rounded text-slate-600 text-[10px] font-bold uppercase" title="Link">LINK</button>
                                  <div className="w-px bg-slate-200 my-1 mx-1"></div>
                                  <button onMouseDown={e => { e.preventDefault(); applyFormatting(field.id, 'ul'); }} className="p-2 hover:bg-slate-100 rounded text-slate-600 text-[10px] font-bold uppercase" title="Bullet List">LIST</button>
                                  <button onMouseDown={e => { e.preventDefault(); applyFormatting(field.id, 'ol'); }} className="p-2 hover:bg-slate-100 rounded text-slate-600 text-[10px] font-bold uppercase" title="Numbered List">NUM</button>
                                  <div className="w-px bg-slate-200 my-1 mx-1"></div>
                                  <button onMouseDown={e => { e.preventDefault(); applyFormatting(field.id, 'clean'); }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded text-[10px] font-bold uppercase transition-colors" title="Clear Formatting">Tx</button>
                                </div>
                              )}
                            </div>

                            {isRich && field.type === 'textarea' ? (
                              <div
                                id={`field-${field.id}`}
                                contentEditable
                                className="w-full min-h-[120px] p-6 bg-slate-50 border border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-slate-200 focus:shadow-inner transition-all text-[15px] leading-relaxed text-black [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-slate-800 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-slate-700 [&_p]:mb-4 [&_strong]:font-bold [&_em]:italic [&_a]:text-[#f14924] [&_a]:underline"
                                onBlur={e => handleFieldChange(field.id, e.currentTarget.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: activeSection.values[field.id] }}
                              />
                            ) : field.type === 'checkbox' ? (
                              <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <input
                                  id={`field-${field.id}`}
                                  type="checkbox"
                                  checked={activeSection.values[field.id] === 'true'}
                                  onChange={e => handleFieldChange(field.id, e.target.checked ? 'true' : 'false')}
                                  className="w-5 h-5 text-[#f14924] rounded focus:ring-[#f14924] border-gray-300 cursor-pointer"
                                />
                                <label htmlFor={`field-${field.id}`} className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                                  {field.label}
                                </label>
                              </div>
                            ) : (
                              <input /* Text/URL inputs for grouped fields usually simpler */
                                type={field.type === 'url' ? 'url' : 'text'}
                                id={`field-${field.id}`}
                                value={activeSection.values[field.id]}
                                onChange={e => handleFieldChange(field.id, e.target.value)}
                                className={`w-full ${field.type === 'textarea' ? 'min-h-[100px]' : 'h-12'} p-4 bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-slate-200 focus:shadow-inner font-mono text-[13px] transition-all text-black`}
                                as={field.type === 'textarea' ? 'textarea' : 'input'}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            });
          })()}

          <div className="pt-8 border-t border-slate-100 mt-8 space-y-6">
            {/* Status Checkboxes */}
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${activeSection.status === 'in-progress' ? 'bg-[#F0F4FF] border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={activeSection.status === 'in-progress'}
                  onChange={() => updateSectionStatus(activeSection.uId, activeSection.status === 'in-progress' ? undefined : 'in-progress')}
                />
                <span className="text-xs font-bold uppercase tracking-wide">In Progress</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${activeSection.status === 'completed' ? 'bg-[#ECFDF5] border-emerald-200 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  checked={activeSection.status === 'completed'}
                  onChange={() => updateSectionStatus(activeSection.uId, activeSection.status === 'completed' ? undefined : 'completed')}
                />
                <span className="text-xs font-bold uppercase tracking-wide">Completed</span>
              </label>
            </div>

            <button onClick={() => removeSection(activeId)} className="w-full text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider px-3 py-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Remove Section
            </button>
          </div>
        </div>

        {/* INSTANT PREVIEW COLUMN */}
        <div className="space-y-12">
          <div className="sticky top-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SECTION PREVIEW</h4>
            </div>
            <PreviewFrame html={rawHtml} css={activeSectionCss} width={1440} />
          </div>
        </div>
      </div>
    );
  };

  const renderFullPreview = () => (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex justify-center gap-4 mb-4">
        <button onClick={() => setViewportMode('desktop')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${viewportMode === 'desktop' ? 'bg-[#0F172A] text-white' : 'bg-white text-slate-400'} `}>Desktop</button>
        <button onClick={() => setViewportMode('mobile')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${viewportMode === 'mobile' ? 'bg-[#0F172A] text-white' : 'bg-white text-slate-400'} `}>Mobile</button>
      </div>
      <div className={`mx-auto transition-all duration-500 ease -in -out ${viewportMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[1440px]'} `}>
        <PreviewFrame html={generateFullHtml()} css={fullPageCss} width={viewportMode === 'mobile' ? 375 : 1440} />
      </div>
    </div>
  );

  const renderExport = () => {
    const htmlCode = beautifyHtml(generateSanitizedHtml());
    const cssCode = generateFinalCss();

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300 h-[calc(100vh-200px)]">
        {/* HTML COLUMN */}
        <div className="flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Page HTML (No Head/Meta)</h3>
            <button onClick={() => copyToClipboard(htmlCode)} className="text-[10px] font-bold uppercase text-[#f14924] hover:underline">Copy HTML</button>
          </div>
          <div className="flex-1 min-h-0">
            <SyntaxHighlighter code={htmlCode} lang="html" />
          </div>
        </div>

        {/* CSS COLUMN */}
        <div className="flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global CSS (WP Ready)</h3>
            <button onClick={() => copyToClipboard(cssCode)} className="text-[10px] font-bold uppercase text-[#f14924] hover:underline">Copy CSS</button>
          </div>
          <div className="flex-1 min-h-0">
            <SyntaxHighlighter code={cssCode} lang="css" />
          </div>
        </div>
      </div>
    );
  }

  const renderSavedPages = () => (
    <div className="space-y-12 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* SAVE NEW PANEL */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-[#f14924] flex items-center justify-center text-[10px] font-black">NEW</span>
          Save Current Layout
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Page Title</label>
            <input
              type="text"
              value={saveTitle}
              onChange={e => setSaveTitle(e.target.value)}
              placeholder="e.g. Landing Page V1"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f14924] transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</label>
            <input
              type="text"
              value={saveNote}
              onChange={e => setSaveNote(e.target.value)}
              placeholder="Optional notes..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#f14924] transition-colors"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              if (!saveTitle) return alert('Please enter a title');
              savePage(saveTitle, saveNote, sections);
              setPageTitle(saveTitle);
              // Note: Ideally we would set activePageId here too, but savePage in this context doesn't return ID in the UI usage below? 
              // Wait, I updated savePage to return ID.
              // But here I'm using the hook directly.
              // Let's assume user might stay on this screen.
              // Actually, let's NOT auto-switch activePageId here to avoid confusion if they just wanted to dump a copy.
              // But to be consistent with "Editor" flow, we probably should. 
              // Let's leave this "Saved Pages" block as is for now, or update it if safe.
              // User request: "leave Current Layout block inside Saved Pages" - so I won't touch logic here too much
              // EXCEPT: I should probably reset activePageId if they save a NEW copy?
              // Or maybe not. Let's stick to the request: "add Save Current Layout block inside editor area"

              setSaveTitle('');
              setSaveNote('');
              alert('Page Saved!');
            }}
            className="px-8 py-3 bg-[#f14924] hover:bg-[#d13d1a] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-[#f14924]/20 uppercase tracking-widest text-xs"
          >
            Save to Library
          </button>
        </div>
      </div>

      {/* SAVED LIST */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Library ({savedPages.length})</h3>

        {savedPages.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <p className="text-slate-400 font-medium">No saved pages yet.</p>
          </div>
        )}

        {/* BACKUP & RESTORE */}
        <div className="flex justify-end gap-4 pb-4 border-b border-slate-100">
          <input
            type="file"
            id="import-file"
            className="hidden"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const content = event.target?.result as string;
                  const data = JSON.parse(content);
                  if (Array.isArray(data)) {
                    importPages(data);
                    alert(`Successfully imported ${data.length} pages.`);
                  } else {
                    alert('Invalid backup file format.');
                  }
                } catch (err) {
                  alert('Failed to parse backup file.');
                  console.error(err);
                }
              };
              reader.readAsText(file);
              e.target.value = ''; // Reset
            }}
          />
          <button
            onClick={() => document.getElementById('import-file')?.click()}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0F172A] transition-colors flex items-center gap-2"
          >
            <span>↓</span> Import Backup
          </button>
          <div className="w-px h-3 bg-slate-300 self-center"></div>
          <button
            onClick={() => {
              const data = JSON.stringify(savedPages, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `velosem-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0F172A] transition-colors flex items-center gap-2"
          >
            <span>↑</span> Export Library
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {savedPages.map(page => {
            // Derived Status Logic
            const hasInProgress = page.sections.some(s => s.status === 'in-progress');
            const allCompleted = page.sections.length > 0 && page.sections.every(s => s.status === 'completed');

            return (
              <div key={page.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <input
                        className="text-lg font-bold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-slate-50 border border-transparent hover:border-slate-200 focus:border-slate-200 rounded px-2 -ml-2 w-full transition-all"
                        value={page.title}
                        onChange={(e) => updatePageMeta(page.id, e.target.value, page.note)}
                      />
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                        <span>{new Date(page.createdAt).toLocaleDateString()}</span>
                        <span>{page.sections.length} Sections</span>
                        {allCompleted && <span className="text-[10px] font-bold text-emerald-600 uppercase border border-emerald-100 px-2 py-0.5 rounded bg-emerald-50">COMPLETED</span>}
                        {!allCompleted && hasInProgress && <span className="text-[10px] font-bold text-blue-600 uppercase border border-blue-100 px-2 py-0.5 rounded bg-blue-50">IN PROGRESS</span>}
                      </div>
                    </div>
                    <input
                      className="text-sm text-slate-500 w-full bg-transparent hover:bg-slate-50 focus:bg-slate-50 border border-transparent hover:border-slate-200 focus:border-slate-200 rounded px-2 -ml-2 transition-all"
                      value={page.note}
                      onChange={(e) => updatePageMeta(page.id, page.title, e.target.value)}
                      placeholder="Add a note..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Load Saved Layout?',
                          message: 'This will overwrite your current editor content. Unsaved changes will be lost.',
                          isDestructive: false,
                          action: () => {
                            loadSections(page.sections);
                            setPageTitle(page.title);
                            setActivePageId(page.id);
                            setSaveNote(page.note || ''); // Set the note for editing
                            setAppTab('editor');
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                          }
                        });
                      }}
                      className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase rounded-lg transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => {
                        const fullHtml = generateFullHtml(page.sections);
                        navigator.clipboard.writeText(fullHtml);
                        alert('Full Page HTML Copied!');
                      }}
                      className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase rounded-lg transition-colors"
                    >
                      Copy HTML
                    </button>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Delete Page?',
                          message: `Are you sure you want to delete "${page.title}"? This action cannot be undone.`,
                          isDestructive: true,
                          action: () => {
                            deletePage(page.id);
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                          }
                        });
                      }}
                      className="px-5 py-2.5 border border-red-100 hover:bg-red-50 text-red-500 hover:text-red-600 text-xs font-bold uppercase rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FBFC] flex overflow-x-hidden font-sans selection:bg-[#f14924]/20 selection:text-[#f14924]">
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 bottom-0 w-[340px] bg-white border-r border-slate-100 flex flex-col z-40">
        <div className="p-8 border-b border-slate-100">
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tighter">VELOSEM</h1>
          <p className="text-[10px] font-bold text-[#f14924] uppercase tracking-[0.3em] -mt-1">Manager v2</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* SECTION STACK */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">YOUR PAGE STRUCTURE</h3>
              {sections.length > 0 && (
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Clear All Sections?',
                      message: 'This will remove every section from your current page. This action cannot be undone.',
                      isDestructive: true,
                      action: () => {
                        clearAllSections();
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                      }
                    });
                  }}
                  className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wider transition-colors"
                >
                  CLEAR ALL
                </button>
              )}
            </div>
            <div className="space-y-2">
              {sections.length === 0 && (
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center pb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ready to Build</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed px-2">Your page is currently empty. Select a template from the <strong className="text-slate-500">LIBRARY</strong> on the left to get started.</p>
                </div>
              )}
              {sections.map((section, idx) => {
                const isActive = section.uId === activeId;
                const tmpl = templates.find(t => t.id === section.templateId);

                // Check if Modified (Legacy check, now superseded by Status for Color)
                const isModified = tmpl?.fields.some(field => {
                  const currents = section.values[field.id];
                  const defaults = field.defaultValue;
                  return currents !== defaults;
                });

                // Status Logic for Color
                let statusColor = 'text-slate-400';
                if (isActive) statusColor = 'text-white';
                else if (section.status === 'completed') statusColor = 'text-emerald-600';
                else if (section.status === 'in-progress') statusColor = 'text-[#0B1220]'; // Dark Blue 
                else {
                  // Fallback logic? User said "If 'no edits' grey". 
                  // Implicitly, if no status is checked, stay gray. 
                  // Ignoring 'isModified' for color per user request to STRICTLY follow status.
                  statusColor = 'text-slate-400';
                }

                return (
                  <div key={section.uId}
                    onClick={() => { setActiveId(section.uId); setAppTab('editor'); }}
                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${isActive ? 'bg-slate-900 border-slate-900 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'} `}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isActive ? 'text-[#f14924]' : 'text-slate-400'} `}>0{idx + 1}</span>
                        <h4 className={`text-sm font-bold ${statusColor}`}>{tmpl?.name || 'Unknown'}</h4>
                      </div>
                      <div className="flex gap-2">
                        {section.status === 'completed' && <span className="text-[10px] font-bold text-emerald-600 uppercase border border-emerald-100 px-1 rounded bg-emerald-50">DONE</span>}
                        {section.status === 'in-progress' && <span className="text-[10px] font-bold text-[#0B1220] uppercase border border-slate-200 px-1 rounded bg-slate-50">PROG</span>}
                      </div>
                    </div>
                    {/* Reorder Controls */}
                    <div className={`absolute right-2 top-2 flex flex-col gap-1 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <button onClick={(e) => { e.stopPropagation(); moveSection(section.uId, 'up'); }} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${isActive ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} `}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveSection(section.uId, 'down'); }} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${isActive ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} `}>▼</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LIBRARY */}
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">ADD COMPONENT</h3>
            <div className="grid grid-cols-1 gap-2">
              {templates.map(t => (
                <button key={t.id} onClick={() => addSection(t.id)} className="text-left px-4 py-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-all font-medium text-slate-600 text-sm">
                  + {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="pl-[340px] flex-1">
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setAppTab('editor')} className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${appTab === 'editor' ? 'bg-white shadow text-[#0F172A]' : 'text-slate-400 hover:text-slate-600'} `}>Editor</button>
            <button onClick={() => setAppTab('preview')} className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${appTab === 'preview' ? 'bg-white shadow text-[#0F172A]' : 'text-slate-400 hover:text-slate-600'} `}>Full Preview</button>
            <button onClick={() => setAppTab('export')} className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${appTab === 'export' ? 'bg-white shadow text-[#0F172A]' : 'text-slate-400 hover:text-slate-600'} `}>Export / Data</button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button onClick={() => setAppTab('saved')} className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${appTab === 'saved' ? 'bg-white shadow text-[#0F172A]' : 'text-slate-400 hover:text-slate-600'} `}>Saved Pages ({savedPages.length})</button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Editing Page</p>
              <p className="text-sm font-bold text-slate-800">{pageTitle}</p>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="p-12 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">
          {appTab === 'editor' && renderEditor()}
          {appTab === 'preview' && renderFullPreview()}
          {appTab === 'export' && renderExport()}
          {appTab === 'saved' && renderSavedPages()}
        </div>
      </main>

      {/* MODALS */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.action || (() => { })}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {linkPopup.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-12 space-y-8 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div>
              <h4 className="text-2xl font-serif font-bold text-[#0F172A]">Insert Link</h4>
              <p className="text-sm text-slate-500 mt-2">Where should this destination lead?</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    // Trigger the same logic as the Apply button
                    const btn = document.querySelector('button.bg-\\[\\#f14924\\]') as HTMLButtonElement; // bit fragile selector but effective here
                    if (btn) btn.click();
                  }
                }}
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-[#f14924] focus:bg-white font-mono text-xs transition-all text-black"
                placeholder="https://example.com"
              />
              <div className="flex gap-4 pt-2">
                <button onClick={() => {
                  // Cancel Logic: Cleanup temp link if it exists
                  if (activeTemplate && activeSection) { // Guard clauses
                    const currentId = linkPopup.id;
                    const val = activeSection.values[currentId] || '';
                    if (val.includes('http://velosem-temp-link')) {
                      // Unwrap the temp link: <a href="...">content</a> -> content
                      const cleanVal = val.replace(/<a\s+href="http:\/\/velosem-temp-link"[^>]*>(.*?)<\/a>/gi, '$1');
                      handleFieldChange(currentId, cleanVal);
                    }
                  }
                  closeLinkPopup();
                }} className="flex-1 px-4 py-5 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                <button onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;

                  // New Apply Link Logic
                  const url = input.value;
                  const sel = savedSelection.current;

                  if (sel && sel.fieldId === linkPopup.id) {
                    if (sel.type === 'visual') {
                      // Visual Mode: Replace the temp placeholder with the real URL
                      const val = activeSection.values[sel.fieldId] || '';
                      // Simple string replace is robust here because the marker is unique
                      const newVal = val.replace('http://velosem-temp-link', url);
                      handleFieldChange(sel.fieldId, newVal);

                    } else if (sel.type === 'code' && sel.start !== undefined && sel.end !== undefined) {
                      // Code Mode: Insert HTML tag
                      const val = activeSection.values[sel.fieldId] || '';
                      const before = val.substring(0, sel.start);
                      const selected = val.substring(sel.start, sel.end);
                      const after = val.substring(sel.end);
                      const newVal = `${before}<a href="${url}">${selected || url}</a>${after}`;

                      handleFieldChange(sel.fieldId, newVal);
                    }
                  } else {
                    // Fallback if no selection was captured (shouldn't happen often)
                    handleLinkConfirm(url);
                  }

                  closeLinkPopup();
                }} className="flex-1 px-4 py-5 bg-[#f14924] text-white text-xs font-black uppercase rounded-[20px] shadow-xl shadow-[#f14924]/30 hover:bg-[#d13d1a] transition-all">Apply Link</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
  .custom-scrollbar:: -webkit-scrollbar { width: 6px; }
        .custom-scrollbar:: -webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar:: -webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar:: -webkit-scrollbar-thumb:hover { background: #cbd5e1; }

        /* Visual Editor Link Highlighting */
        [contenteditable] a {
          color: #f14924;
          text-decoration: underline;
          background-color: rgba(241, 73, 36, 0.1);
          border-radius: 4px;
          padding: 0 4px;
          cursor: pointer;
        }
`}} />
    </div>
  );
};

export default App;
