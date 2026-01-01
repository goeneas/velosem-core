import { useState, useEffect, useCallback } from 'react';
import { Project } from '@velosem/core';

const STORAGE_KEY = 'velosem-projects';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error('Failed to parse projects', e);
                }
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }, [projects]);

    const createProject = useCallback((title: string) => {
        const id = crypto.randomUUID();
        const newProject: Project = {
            id,
            title: title || 'Untitled Project',
            domain: '',
            notes: '',
            assignedUsers: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setProjects(prev => [newProject, ...prev]);
        return id;
    }, []);

    const updateProject = useCallback((id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
        setProjects(prev => prev.map(project => {
            if (project.id !== id) return project;
            return { ...project, ...updates, updatedAt: Date.now() };
        }));
    }, []);

    const deleteProject = useCallback((id: string) => {
        setProjects(prev => prev.filter(project => project.id !== id));
    }, []);

    const getProject = useCallback((id: string) => {
        return projects.find(p => p.id === id);
    }, [projects]);

    return {
        projects,
        createProject,
        updateProject,
        deleteProject,
        getProject
    };
}
