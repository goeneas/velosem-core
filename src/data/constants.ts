
export const COMMON_CSS_BASE = `
:root {
  --navy: #0F172A;
  --orange: #f14924;
  --orange-dark: #d13d1a;
  --slate: #334155;
  --light: #F8FAFC;
  --white: #ffffff;
  --gray: #475569;
  --sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --serif: Georgia, 'Times New Roman', Times, serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--sans); color: var(--slate); background: var(--white); line-height: 1.6; white-space: normal; }

/* Reset container background to transparent to avoid WP Theme conflicts */
.container { 
  max-width: 1280px; 
  margin: 0 auto; 
  padding: 0 1.5rem; 
  background-color: transparent !important; 
  width: 100%;
}

/* Clear WP filters */
.container > p:empty, .container > br { display: none !important; }

h1, h2, h3, h4 { font-family: var(--serif); color: var(--navy); font-weight: 700; line-height: 1.2; }

.btn { 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  padding: 0.875rem 2rem; 
  font-weight: 700; 
  text-decoration: none; 
  cursor: pointer; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
  border: 1px solid transparent; 
  text-align: center;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  width: auto !important;
  max-width: none !important;
}

.btn-gold { background: var(--orange); color: var(--white); border: 2px solid var(--orange); }
.btn-gold:hover { background: transparent; color: var(--orange); }

.btn-navy { background: var(--navy); color: var(--white); border: 2px solid var(--navy); }
.btn-navy:hover { background: transparent; color: var(--navy); }

.btn-outline { border: 2px solid currentColor; background: transparent; }
.btn-outline:hover { background: var(--navy); color: var(--white); border-color: var(--navy); }

.icon { width: 1.25rem; height: 1.25rem; flex-shrink: 0; }

@media (max-width: 640px) {
  .btn { width: 100%; }
}
`;

export const SVG_ICONS = {
  arrowRight: `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`,
  check: `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`,
  home: `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`,
  quote: `<svg style="width: 3.5rem; height: 3.5rem;" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.896 14.353 15.925 15.025 15.087C15.697 14.249 16.637 13.567 17.845 13.041V10.777C15.903 10.999 14.509 11.559 13.663 12.457C12.817 13.355 12.394 14.613 12.394 16.231V21H2V11.232C2 8.783 2.651 6.578 3.953 4.617C5.255 2.656 7.227 1.328 9.869 0.632996L11.24 3.015C9.408 3.774 8.019 4.793 7.073 6.072C6.127 7.351 5.654 8.913 5.654 10.758V11H14.017V21ZM22 21L22 18C22 16.896 22.336 15.925 23.008 15.087C23.68 14.249 24.62 13.567 25.828 13.041V10.777C23.886 10.999 22.492 11.559 21.646 12.457C20.8 13.355 20.377 14.613 20.377 16.231V21H10V11.232C10 8.783 10.651 6.578 11.953 4.617C13.255 2.656 15.227 1.328 17.869 0.632996L19.24 3.015C17.408 3.774 16.019 4.793 15.073 6.072C14.127 7.351 13.654 8.913 13.654 10.758V11H22V21Z"></path></svg>`
};
