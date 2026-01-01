import { useState, useEffect, useCallback } from 'react';
import type { SavedPage, EditorSection } from '@velosem/core';

const STORAGE_KEY = 'velosem-studio-v2-library';

export function useSavedPages() {
    const [savedPages, setSavedPages] = useState<SavedPage[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error('Failed to parse saved pages', e);
                }
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPages));
    }, [savedPages]);

    const savePage = useCallback((title: string, notes: string, sections: EditorSection[], projectId?: string) => {
        const id = crypto.randomUUID();
        const newPage: SavedPage = {
            id,
            title: title || 'Untitled Page',
            notes: notes || '',
            projectId,
            sections,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setSavedPages(prev => [newPage, ...prev]);
        return id;
    }, []);

    const updatePageMeta = useCallback((id: string, title: string, notes: string) => {
        setSavedPages(prev => prev.map(page => {
            if (page.id !== id) return page;
            return { ...page, title, notes, updatedAt: Date.now() };
        }));
    }, []);

    const updatePageContent = useCallback((id: string, sections: EditorSection[]) => {
        setSavedPages(prev => prev.map(page => {
            if (page.id !== id) return page;
            return {
                ...page,
                sections,
                updatedAt: Date.now()
            };
        }));
    }, []);

    const deletePage = useCallback((id: string) => {
        setSavedPages(prev => prev.filter(page => page.id !== id));
    }, []);

    const importPages = useCallback((newPages: SavedPage[]) => {
        setSavedPages(prev => {
            // Merge strategy:
            // 1. Keep all previous pages that are NOT in the new set (by ID)
            // 2. Add all new pages (overwriting if ID existed)
            // Actually, for a "Restore", maybe we just want to ADD missing ones? 
            // Or if user says "Import", they might expect it to restore the state of that file.
            // Let's go with: Merge, preferring Imported version for collisions.

            const importedMap = new Map(newPages.map(p => [p.id, p]));
            const merged = [...prev.filter(p => !importedMap.has(p.id)), ...newPages];

            // Sort by createdAt descending (newest first)
            return merged.sort((a, b) => b.createdAt - a.createdAt);
        });
    }, []);

    const getPagesByProject = useCallback((projectId: string) => {
        return savedPages.filter(page => page.projectId === projectId);
    }, [savedPages]);

    const deletePagesByProject = useCallback((projectId: string) => {
        setSavedPages(prev => prev.filter(page => page.projectId !== projectId));
    }, []);

    return {
        savedPages,
        savePage,
        updatePageMeta,
        updatePageContent,
        deletePage,
        importPages,
        getPagesByProject,
        deletePagesByProject
    };
}
