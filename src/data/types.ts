
export interface EditableField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'checkbox' | 'rich-text' | 'select';
  defaultValue: string;
  group?: string;
  options?: string[];
  helpText?: string;
}

export interface TemplateSection {
  id: string;
  name: string;
  description: string;
  fields: EditableField[];
  css: string;
  renderHtml: (values: Record<string, string>) => string;
  referenceHtml: string;
}
// Editor State Types
export interface EditorSection {
  uId: string;
  templateId: string;
  values: Record<string, string>;
  status?: 'in-progress' | 'completed';
}

export interface SavedPage {
  id: string;
  title: string;
  notes: string;
  projectId?: string;
  sections: EditorSection[];
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  title: string;
  domain: string;
  notes: string;
  assignedUsers: string;
  createdAt: number;
  updatedAt: number;
}
