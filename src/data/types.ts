
export interface EditableField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'checkbox';
  defaultValue: string;
  group?: string;
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
  note: string;
  sections: EditorSection[];
  createdAt: number;
  updatedAt: number;
}
