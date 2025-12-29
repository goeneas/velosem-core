import { useState, useCallback, useMemo, useEffect } from 'react';
import { templates } from '../data/templates';
import { COMMON_CSS_BASE } from '../data/constants';
import js_beautify from 'js-beautify';

import { EditorSection } from '../data/types';

const STORAGE_KEY = 'velosem-studio-v2-draft';

export function useTemplateEditor() {
  // --- Core State: Ordered List of Sections ---
  const [sections, setSections] = useState<EditorSection[]>(() => {
    // Initialize from LocalStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    }
    // Default Fallback
    return [{
      uId: crypto.randomUUID(),
      templateId: 'hero',
      values: templates.find(t => t.id === 'hero')?.fields.reduce((acc, field) => ({
        ...acc,
        [field.id]: field.defaultValue
      }), {}) || {}
    }];
  });

  // activeId now refers to the SECTION INSTANCE ID (uId), not the template ID.
  // activeId now refers to the SECTION INSTANCE ID (uId), not the template ID.
  const [activeId, setActiveId] = useState<string>(sections.length > 0 ? sections[0].uId : '');

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  // UI State
  const [activeTab, setActiveTab] = useState<'content' | 'styles' | 'export'>('content');
  const [fieldModes, setFieldModes] = useState<Record<string, 'visual' | 'code'>>({});
  const [linkPopup, setLinkPopup] = useState<{ id: string; isOpen: boolean }>({ id: '', isOpen: false });

  // --- Derived State ---

  // The currently selected SECTION
  const activeSection = useMemo(() =>
    sections.find(s => s.uId === activeId) || sections[0] || null,
    [sections, activeId]);

  // The TEMPLATE CONFIG for the active section (fields, css, structure)
  const activeTemplate = useMemo(() =>
    activeSection ? (templates.find(t => t.id === activeSection.templateId) || templates[0]) : null,
    [activeSection]);

  // --- Actions ---

  // Clear all sections
  const clearAllSections = useCallback(() => {
    setSections([]);
    setActiveId('');
  }, []);

  // Add a new section to the stack
  const addSection = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newSection: EditorSection = {
      uId: crypto.randomUUID(),
      templateId: template.id,
      values: template.fields.reduce((acc, field) => ({
        ...acc,
        [field.id]: field.defaultValue
      }), {})
    };

    setSections(prev => [...prev, newSection]);
    setActiveId(newSection.uId); // Auto-select new section
    setActiveTab('content'); // Switch to content edit mode
  }, []);

  // Move section up/down
  const moveSection = useCallback((uId: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const index = prev.findIndex(s => s.uId === uId);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;

      const newSections = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      return newSections;
    });
  }, []);

  // Remove section
  const removeSection = useCallback((uId: string) => {
    setSections(prev => {
      const newSections = prev.filter(s => s.uId !== uId);
      // If we deleted the active section, select the one before it (or first)
      if (uId === activeId) {
        if (newSections.length === 0) {
          setActiveId('');
        } else {
          const deletedIndex = prev.findIndex(s => s.uId === uId);
          const newActiveIndex = Math.max(0, deletedIndex - 1);
          setActiveId(newSections[newActiveIndex].uId);
        }
      }
      return newSections;
    });
  }, [activeId]);

  // Update a field value for the ACTIVE section
  const handleFieldChange = useCallback((id: string, value: string) => {
    setSections(prev => prev.map(section => {
      if (section.uId !== activeId) return section;

      const newValues = { ...section.values, [id]: value };

      // Auto-populate Alt Text from Filename if this is an image field
      if (id.includes('img') || id.includes('image')) {
        // Simple logic: if field ID ends with 'img' or 'image', look for corresponding '_alt'
        const baseId = id;
        // Heuristic: if id is 'img', alt is 'img_alt'. If 'project1_image', alt is 'project1_alt'.
        // Actually, we standardized on: img -> img_alt. project1_image -> project1_alt.
        let altId = '';
        if (id === 'img') altId = 'img_alt';
        else if (id.endsWith('_image')) altId = id.replace('_image', '_alt');

        // Only update if we found a valid Alt ID and the new value looks like a URL/Path
        if (altId && value && value.includes('/')) {
          try {
            const filename = value.split('/').pop()?.split('.')[0] || '';
            // Replace dashes/underscores with spaces for better readability, or keep raw? 
            // User asked for: "41-Back-of-Home... will prepopulate 41-Back-of-Home..."
            // So raw filename without extension.
            if (filename) {
              newValues[altId] = filename;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      return {
        ...section,
        values: newValues
      };
    }));
  }, [activeId]);

  // Update Section Status
  const updateSectionStatus = useCallback((uId: string, status: 'in-progress' | 'completed' | undefined) => {
    setSections(prev => prev.map(section => {
      if (section.uId !== uId) return section;
      return { ...section, status };
    }));
  }, []);

  // UI Helpers
  const toggleFieldMode = useCallback((id: string) => {
    setFieldModes(prev => ({
      ...prev,
      [id]: prev[id] === 'code' ? 'visual' : 'code'
    }));
  }, []);

  const openLinkPopup = useCallback((id: string) => setLinkPopup({ id, isOpen: true }), []);
  const closeLinkPopup = useCallback(() => setLinkPopup({ id: '', isOpen: false }), []);

  const handleLinkConfirm = useCallback((url: string) => {
    if (linkPopup.id) handleFieldChange(linkPopup.id, url);
    closeLinkPopup();
  }, [linkPopup.id, handleFieldChange, closeLinkPopup]);

  // --- Export Logic ---
  const generateFullHtml = useCallback((targetSections: EditorSection[] = sections) => {
    return targetSections.map(section => {
      const tmpl = templates.find(t => t.id === section.templateId);
      if (!tmpl) return '';
      const content = tmpl.renderHtml(section.values);
      return `<!-- ${tmpl.name} Start -->\n${content}\n<!-- ${tmpl.name} End -->`;
    }).join('\n');
  }, [sections]);

  const generateSanitizedHtml = useCallback(() => {
    let fullHtml = generateFullHtml();
    // Sanitization: Strip internal Editor attributes
    return fullHtml
      .replace(/ data-uid="[^"]*"/g, '')
      .replace(/ key="[^"]*"/g, '');
  }, [generateFullHtml]);

  const generateFinalCss = useCallback(() => {
    // Combine CSS from ALL templates (Global CSS)
    const templateCss = templates
      .map(t => t.css || '')
      .join('\n');

    // Combine CSS
    return `${COMMON_CSS_BASE}\n\n/* --- Component Styles --- */\n${templateCss}`;
  }, []);

  const generateBundle = useCallback(() => {
    const fullHtml = generateSanitizedHtml();
    const fullCss = generateFinalCss();

    // Meta Extraction: Find first H1
    const titleMatch = fullHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : 'VeloSem Studio | Home';

    // Create Bundle
    const bundle = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Integrity Remodeling - Transform your home with masterful builds and unified design.">
  <title>${pageTitle}</title>
  <style>
${fullCss}
  </style>
</head>
<body>
${fullHtml}
</body>
</html>`;

    return bundle;
  }, [generateSanitizedHtml, generateFinalCss]);

  const beautifyHtml = (html: string) => {
    return js_beautify.html(html, {
      indent_size: 2,
      wrap_line_length: 0,
      preserve_newlines: false,
      extra_liners: []
    });
  };

  return {
    // State
    sections,
    activeId,
    activeSection,
    activeTemplate,
    activeTab,
    fieldModes,
    linkPopup,

    // Actions
    setActiveId,
    setActiveTab,
    addSection,
    moveSection,
    removeSection,
    clearAllSections,
    handleFieldChange,
    updateSectionStatus,
    toggleFieldMode,
    openLinkPopup,
    closeLinkPopup,
    handleLinkConfirm,

    // Utils
    generateFullHtml,
    generateSanitizedHtml,
    generateFinalCss,
    generateBundle,
    beautifyHtml,
    loadSections: (newSections: EditorSection[]) => {
      setSections(newSections);
      if (newSections.length > 0) setActiveId(newSections[0].uId);
      setActiveTab('content');
    }
  };
}
