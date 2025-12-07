# Design Guidelines: Venmo Transaction Visualizer

## Design Approach

**Selected Framework:** Carbon Design System (IBM)  
**Rationale:** Carbon excels at data-intensive applications with complex visualizations, tables, and analytics workflows. Its structured approach ensures clarity in information-dense interfaces.

## Core Design Principles

1. **Data First:** Maximize space for visualization and tables, minimize decorative elements
2. **Visual Hierarchy:** Clear separation between controls, data views, and summary statistics
3. **Progressive Disclosure:** Guide users from upload → visualization → detailed analysis
4. **Responsive Data:** Adapt visualization complexity based on viewport size

---

## Typography

**Font Family:** IBM Plex Sans (primary), IBM Plex Mono (data/numbers)

**Scale:**
- Page Title: 32px, semibold
- Section Headers: 24px, medium
- Tab Labels: 16px, medium
- Body Text: 14px, regular
- Data Tables: 13px, regular
- Small Labels/Stats: 12px, regular
- Numbers/Amounts: IBM Plex Mono, 14px

---

## Layout System

**Spacing Units:** Use Tailwind units of 2, 4, 6, 8, and 12 for consistent rhythm
- Component padding: p-4 to p-6
- Section margins: mb-8 to mb-12
- Card spacing: gap-6
- Table cell padding: p-4

**Grid Structure:**
- Upload Panel: Fixed left sidebar (w-80), sticky positioning
- Main Content: Flexible remaining space with max-w-7xl container
- Summary Stats: Bottom panel or right sidebar depending on viewport
- Mobile: Full-width stacked layout

---

## Component Library

### Navigation & Structure

**Tab Navigation:**
- Horizontal pill-style tabs with active state indicator
- Tabs: "Sankey Diagram" | "Aggregated View" | "Raw Transactions" | "Settings"
- Clean underline or filled background for active state
- Tab bar sticky at top of main content area

**Upload Panel (Sidebar):**
- Drag-and-drop zone with dashed border and icon
- File list with individual remove buttons
- "Clear All" button at bottom
- Upload count badge
- Compact file cards showing filename and size

### Data Visualization

**Sankey Diagram Container:**
- Full-width card with subtle border
- Toolbar above diagram: zoom controls, reset view, export PNG
- Interactive legend mapping colors to people
- Tooltip on hover showing exact amounts and percentage
- Minimum height of 500px, responsive scaling

**Summary Statistics Panel:**
- Grid of stat cards (4 columns on desktop, 2 on tablet, 1 on mobile)
- Each card: large number, label, subtle icon
- Cards: Total Sent | Total Received | Total Transactions | Unique People
- Top 10 lists in expandable accordions below stats

### Tables

**Table Component (Tabulator):**
- Clean row separators with zebra striping option
- Fixed header that stays visible on scroll
- Column headers with sort indicators
- Search bar integrated above table
- Pagination controls at bottom
- Row actions on hover (expand for details)
- Exportable via button in table header

**Table Columns:**
1. Date (sortable, formatted)
2. From (filterable)
3. To (filterable)
4. Amount (right-aligned, formatted with $)
5. Type badge
6. Note (truncated with expand)
7. Source file badge

### Forms & Controls

**Upload Zone:**
- Large dashed border rectangle (min-h-48)
- Upload icon (cloud with arrow)
- Primary text: "Drag & drop CSV files here"
- Secondary text: "or click to browse"
- Accept indicator on drag-over

**Filters & Settings:**
- Toggle switches for binary options
- Checkbox groups for multi-select filters
- Date range picker for temporal filtering
- Clear filters button

**Buttons:**
- Primary: Upload, Export, Apply Filters
- Secondary: Clear, Reset, Cancel
- Danger: Remove file, Delete
- Icon buttons for table actions

### Cards & Containers

**File Card:**
- Compact horizontal layout
- File icon + name + size
- Remove button (X) on right
- Subtle border and hover state

**Stat Card:**
- Centered content
- Large number (32px) on top
- Label (12px) below
- Optional trend indicator or icon

---

## Visual Elements

**Borders:** 1px solid, subtle contrast  
**Border Radius:** 4px for cards, 2px for inputs, 8px for upload zone  
**Shadows:** Minimal - use sparingly for elevated cards only  
**Iconography:** Heroicons (outline for secondary actions, solid for primary)

---

## Sankey Diagram Specifics

**Node Design:**
- Width: 15px rectangles
- Height: Proportional to transaction volume
- Labels: Left-aligned for source nodes, right-aligned for target nodes
- Padding: 10px between nodes

**Link Design:**
- Curved paths using bezier curves
- Opacity: 0.5 default, 0.8 on hover
- Width: Proportional to transaction volume
- Distinct hue per person/entity

**Interactivity:**
- Hover: Highlight all connected paths
- Click node: Filter table to show related transactions
- Zoom: Mouse wheel or pinch
- Pan: Click and drag background

---

## Responsive Behavior

**Desktop (1280px+):**
- Left sidebar (320px) + main content + optional right summary panel
- Full Sankey with all labels
- 6-column table

**Tablet (768px - 1279px):**
- Collapsible sidebar to drawer
- Sankey scales down, condensed labels
- 4-column table

**Mobile (<768px):**
- Full-width stacked layout
- Bottom sheet for upload panel
- Simplified Sankey or table-only view
- 2-column table (From→To, Amount)

---

## Animations

**Minimal Use:**
- Sankey path transitions on filter: 300ms ease
- Tab switching: 200ms fade
- File upload success: Brief checkmark animation
- No other animations - focus on performance with large datasets

---

## Images

**No hero image required** - This is a data analysis tool, not a marketing page. Focus entirely on functional UI elements and visualization clarity.