export interface AtomStyle {
    // Box Model
    width?: string;
    height?: string;
    minWidth?: string;
    minHeight?: string;
    maxWidth?: string;
    maxHeight?: string;
    margin?: string;
    padding?: string;
    border?: string;
    boxSizing?: 'content-box' | 'border-box' | 'inherit' | 'initial' | 'unset';

    // Typography
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string | number;
    lineHeight?: string | number;
    textAlign?: 'left' | 'right' | 'center' | 'justify' | 'start' | 'end';
    color?: string;

    // Backgrounds
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;

    // Layout
    display?: 'block' | 'inline-block' | 'inline' | 'flex' | 'grid' | 'none';
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
    flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    gridTemplateColumns?: string;
    zIndex?: number | string;
    cursor?: string;
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
    aspectRatio?: string;

    // Visual Effects
    opacity?: number | string;
    boxShadow?: string;
    borderRadius?: string;
    filter?: string;

    // Flexbox
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline';
    flexGrow?: number | string;
    flexShrink?: number | string;
    flex?: string;

    // Grid
    gridArea?: string;
    gap?: string;
    gridAutoFlow?: 'row' | 'column' | 'row dense' | 'column dense';

    // Transitions & Animations
    transitionDuration?: string;
    animationName?: string;
    animationDelay?: string;

    // Lists
    listStyleType?: string;
    listStylePosition?: 'inside' | 'outside';
    listStyleImage?: string;
}

export interface Atom {
    id: string;
    type: string; // e.g., 'div', 'h1', 'p', 'img', 'section', 'container'
    content?: string; // Text content if applicable
    src?: string; // For images
    alt?: string; // For images
    style: AtomStyle;
    children?: Atom[];
    // Metadata for the editor
    label?: string; // Friendly name for the layer list
    isOpen?: boolean; // For the layer list accordion state
}
