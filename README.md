# @velosem/core

Open source page builder core for VeloSem Studio.

## Features

- **Section Composer**: Add, remove, reorder page sections
- **Template Renderer**: Convert JSON data to semantic HTML
- **Export Engine**: Generate clean HTML/CSS bundles
- **Static Template Library**: Pre-built section templates

## Installation

```bash
npm install @velosem/core
```

Or for local development:

```bash
npm install file:../velosem-core
```

## Usage

```tsx
import {
  useTemplateEditor,
  templates,
  PreviewFrame,
  COMMON_CSS_BASE
} from '@velosem/core';

function App() {
  const {
    sections,
    addSection,
    removeSection,
    handleFieldChange,
    generateBundle
  } = useTemplateEditor();

  return (
    <div>
      {/* Your editor UI */}
    </div>
  );
}
```

## Exports

### Data
- `templates` - Array of available section templates
- `COMMON_CSS_BASE` - Base CSS variables and reset styles

### Types
- `EditorSection` - Section instance with values
- `SavedPage` - Saved page with metadata
- `TemplateSection` - Template definition
- `EditableField` - Field configuration

### Hooks
- `useTemplateEditor()` - Main editor state and actions

### Components
- `PreviewFrame` - Iframe-based live preview
- `ConfirmationModal` - Reusable confirmation dialog
- `TemplateCard` - Template selection card

## Development

```bash
# Install dependencies
npm install

# Type check
npx tsc --noEmit
```

## License

MIT © VeloSem
