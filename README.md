# D Anmol Enterprises — Institute Dashboard

## Project files
- `index.html` — page structure and dashboard sections
- `styles.css` — layout, colors, responsive styles, and logo styling
- `app.js` — students, courses, attendance, fee/EMI tracking, Excel import/export and browser storage
- `assets/d-anmol-logo.png` — D Anmol IT Solutions logo

The dashboard layout adapts to desktop, tablet, and mobile screen sizes. On narrow screens, the navigation can be scrolled horizontally and wide data tables scroll within their containers.

## Run locally
1. Open this folder in VS Code.
2. Use the Live Server extension and open `index.html`, or open `index.html` directly in Chrome.
3. Excel import uses SheetJS from a CDN, so internet is needed for Excel import/template features.

## Important storage note
This version stores data in the current browser's LocalStorage. It is not yet a multi-user production deployment. For shared online data, add a database (e.g. Supabase/PostgreSQL), authentication, access policies, backups, and database-backed import/export before using real student records.

## Student data
Use **Export JSON Backup** regularly. Do not put real student personal information into a publicly hosted demo without authentication and suitable access controls.
