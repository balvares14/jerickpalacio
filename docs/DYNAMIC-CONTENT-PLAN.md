# Dynamic Portfolio — Architecture Plan

This document describes how we will move from hard-coded content (`src/data/projects.js`) to a **database-driven portfolio** where the owner manages everything through an **admin area**, using the agreed stack.

---

## Stack recap

| Layer | Tool | Role in this project |
|---|---|---|
| Frontend | React + Vite | Public site + admin UI |
| Hosting | Vercel | Deploy frontend; SPA rewrites already in `vercel.json` |
| Database + Auth | Supabase (PostgreSQL) | Site settings, nav labels, projects, page blocks, inquiries |
| File Storage | Supabase Storage | Cover images, gallery media, optional logo image |
| Domain + DNS | Cloudflare | Custom domain → Vercel |
| Version Control | GitHub | Source of truth; Vercel auto-deploy on push |

---

## High-level idea

The **Work page** (`/` or `/work`) is a **shell** that reads global settings and a list of **project covers** from Supabase. Each cover links to a **project route** (e.g. `/wedding-photography`). That route renders a **template** chosen per project — single column gallery, multi-column grid, alternating text + media, etc.

The **Inquiry page** (`/contact`) stays a separate static route for now; later it can also pull copy from `site_settings` and submit to an `inquiries` table.

An **Admin area** (`/admin`, auth-protected) lets the owner edit all of this without touching code.

```
┌─────────────────────────────────────────────────────────────┐
│  Public site (React)                                        │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Layout   │  │ WorkPage     │  │ ProjectPage         │   │
│  │ (header) │  │ (grid)       │  │ (template renderer) │   │
│  └────┬─────┘  └──────┬───────┘  └──────────┬──────────┘   │
│       │               │                      │              │
│       └───────────────┴──────────────────────┘              │
│                       │ read (anon)                         │
└───────────────────────┼─────────────────────────────────────┘
                        ▼
              ┌──────────────────┐
              │ Supabase         │
              │ • site_settings  │
              │ • nav_items      │
              │ • projects       │
              │ • project_blocks │
              │ • media (Storage)│
              └────────▲─────────┘
                       │ read/write (authenticated owner)
              ┌────────┴─────────┐
              │ Admin (/admin)   │
              └──────────────────┘
```

---

## What becomes dynamic (maps to current UI)

Today these are hard-coded. Each maps to a database field or related row.

### Global / header (`SiteHeader`, `ResponsiveNav`)

| UI element | Current source | Dynamic source |
|---|---|---|
| Logo text (`.logo-text`) | `SITE_NAME` in `projects.js` | `site_settings.logo_text` |
| Logo image (optional) | — | `site_settings.logo_image_url` (Supabase Storage) |
| Logo link target | `/contact` | `site_settings.logo_link_path` |
| Gallery nav label (`.gallery-title`) | `"Work"` | `nav_items` where `slot = 'gallery'` |
| Page nav label (`.page-title`) | `"Contact Inquiry"` | `nav_items` where `slot = 'page'` |
| Nav link paths | `/work`, `/contact` | `nav_items.path` per row |

Nav labels and paths are editable so the owner can rename “Work” → “Portfolio” or add more top-level pages later without code changes.

### Work page masthead (`WorkPage`)

| UI element | Current source | Dynamic source |
|---|---|---|
| Show masthead at all | always on | `site_settings.masthead_enabled` (boolean) |
| Masthead title (`h1`) | hard-coded string | `site_settings.masthead_title` |
| Masthead subtitle (`p`) | hard-coded string | `site_settings.masthead_subtitle` |
| Scroll arrow | always if masthead shown | `site_settings.masthead_show_arrow` |

When `masthead_enabled = false`, the page opens directly on the project grid (no hero section).

### Project grid covers (`ProjectCover`)

Each row in `projects` drives one `.project-cover` card.

| UI element | Dynamic source |
|---|---|
| Cover media (image or video) | `projects.cover_media_type`, `projects.cover_media_url` |
| Title (`.details .title`) | `projects.title` |
| Date / subtitle (`.details .date`) | `projects.subtitle` (year, category, etc.) |
| Route (`href`) | `projects.slug` → `/projects/:slug` or `/:slug` |
| Sort order in grid | `projects.sort_order` |
| Published / hidden | `projects.is_published` |

Cover video: if `cover_media_type = 'video'`, render `<video>` (muted, loop, poster optional) instead of `<img>`.

### Footer

| UI element | Dynamic source |
|---|---|
| Footer link text | `site_settings.footer_text` (default: same as logo text) |
| Footer link path | `site_settings.footer_link_path` |

---

## Database schema (Supabase)

Single-owner portfolio for v1. One row in `site_settings`; optional multi-tenant later via `site_id`.

### `site_settings` (singleton, one row)

```sql
create table site_settings (
  id uuid primary key default gen_random_uuid(),
  logo_text text not null default 'Jerick Palacio',
  logo_image_url text,
  logo_link_path text not null default '/contact',
  footer_text text,
  footer_link_path text default '/contact',
  masthead_enabled boolean not null default true,
  masthead_title text,
  masthead_subtitle text,
  masthead_show_arrow boolean not null default true,
  updated_at timestamptz not null default now()
);
```

### `nav_items`

Supports the two header slots today; extensible for more links.

```sql
create table nav_items (
  id uuid primary key default gen_random_uuid(),
  slot text not null check (slot in ('gallery', 'page', 'extra')),
  label text not null,
  path text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  unique (slot) -- v1: one label per slot; relax later for multiple extras
);
```

Seed:

- `gallery` → label `Work`, path `/work`
- `page` → label `Contact Inquiry`, path `/contact`

### `projects`

One row per grid card **and** its detail page.

```sql
create type cover_media_type as enum ('image', 'video');
create type project_template as enum (
  'single_column',
  'multi_column',
  'alternating',
  'full_bleed',
  'video_gallery'
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  cover_media_type cover_media_type not null default 'image',
  cover_media_url text not null,
  cover_poster_url text, -- for video covers
  template project_template not null default 'single_column',
  is_published boolean not null default false,
  sort_order int not null default 0,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `project_blocks`

Ordered content sections **inside** a project page. The `template` on `projects` picks the **layout wrapper**; blocks are the actual content.

```sql
create type block_type as enum (
  'heading',
  'paragraph',
  'image',
  'video',
  'image_row',      -- 2–4 images side by side
  'spacer'
);

create table project_blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  block_type block_type not null,
  sort_order int not null default 0,
  content jsonb not null default '{}',
  -- examples:
  -- heading:    { "text": "Wedding at Malibu" }
  -- paragraph:  { "text": "Shot on 35mm..." }
  -- image:      { "url": "...", "alt": "...", "caption": "..." }
  -- video:      { "url": "...", "poster_url": "...", "autoplay": false }
  -- image_row:  { "urls": ["...", "..."], "columns": 2 }
  created_at timestamptz not null default now()
);

create index project_blocks_project_id_sort on project_blocks (project_id, sort_order);
```

### `inquiries` (Contact page — phase 2)

```sql
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
```

---

## Project page templates

Each project selects a **template**. React components mirror the enum:

| Template | Behavior | Good for |
|---|---|---|
| `single_column` | Full-width blocks stacked vertically | Photo essays, one image per row |
| `multi_column` | Responsive 2–3 column grid of media blocks | Contact sheets, many stills |
| `alternating` | Text block ↔ media block left/right alternating | Case studies with copy |
| `full_bleed` | Edge-to-edge images, minimal text | Landscape / fashion |
| `video_gallery` | Featured video + supporting stills | Film & video work |

### Routing

```jsx
// App.jsx (future)
<Route path="/" element={<WorkPage />} />
<Route path="/work" element={<WorkPage />} />
<Route path="/contact" element={<InquiryPage />} />
<Route path="/:slug" element={<ProjectPage />} />  // or /projects/:slug
<Route path="/admin/*" element={<AdminLayout />} />
```

`ProjectPage` loads `projects` by `slug`, checks `is_published`, then:

1. Pick layout component from `project.template`
2. Map `project_blocks` → block components (`HeadingBlock`, `ImageBlock`, …)

Unpublished projects return 404 on the public site; visible in admin with a “draft” badge.

---

## Supabase Storage

**Buckets**

| Bucket | Public read | Upload |
|---|---|---|
| `covers` | yes | authenticated owner |
| `gallery` | yes | authenticated owner |
| `logo` | yes | authenticated owner |

**Path convention**

```
covers/{project_id}/cover.jpg
covers/{project_id}/cover.mp4
gallery/{project_id}/{uuid}.jpg
logo/logo.png
```

Admin upload flow: file → Storage → store public URL in `projects.cover_media_url` or `project_blocks.content.url`.

Use Supabase image transforms (or pre-generate sizes later) instead of manual `srcSet` strings.

---

## Row Level Security (RLS)

**Public (anon key — used by the live site)**

- `SELECT` on `site_settings`, `nav_items`, `projects` where `is_published = true`, and `project_blocks` for published projects only
- `INSERT` on `inquiries` only (contact form)
- Storage: public read on `covers`, `gallery`, `logo`

**Authenticated owner**

- Full CRUD on all content tables
- Storage upload/update/delete

Auth: Supabase Auth with **email + password** (or magic link) for a single admin user. No public sign-up; invite-only via Supabase dashboard.

Optional: store `auth.users.id` in a `profiles` table with `role = 'owner'` and gate policies on that.

---

## Frontend data layer

Replace `src/data/projects.js` with hooks/services:

```
src/
  lib/
    supabaseClient.js          # Supabase client (export: supabase)
  hooks/
    useSiteSettings.js
    useNavItems.js
    useProjects.js
    useProject.js        # slug → project + blocks
  components/
    blocks/              # HeadingBlock, ImageBlock, VideoBlock, …
    templates/           # SingleColumnTemplate, AlternatingTemplate, …
  pages/
    WorkPage.jsx         # fetch settings + projects
    ProjectPage.jsx      # fetch by slug, render template
    InquiryPage.jsx
  admin/
    AdminLayout.jsx
    Dashboard.jsx
    SiteSettingsForm.jsx
    ProjectsList.jsx
    ProjectEditor.jsx    # cover, template, block builder
```

**Loading strategy (v1)**

- Fetch on mount with Supabase client
- Simple loading skeletons while data loads
- Optional later: React Query for cache + optimistic admin updates

**Fallback**

If Supabase env vars are missing (local dev), fall back to current static `projects.js` so `npm run dev` still works.

---

## Admin area (`/admin`)

Protected routes. Unauthenticated users redirect to `/admin/login`.

### Screens

1. **Login** — Supabase `signInWithPassword`
2. **Dashboard** — quick links, draft count
3. **Site settings** — logo text/image, masthead toggle + copy, footer
4. **Navigation** — edit gallery/page labels and paths
5. **Projects list** — reorder (drag), publish toggle, delete
6. **Project editor**
   - Cover: upload image/video, title, subtitle, slug, template picker
   - Blocks: add/reorder/delete blocks (block builder UI)
   - Preview opens public URL in new tab
7. **Inquiries** (phase 2) — read-only list of contact submissions

### Block builder UX

- “Add block” menu: Heading, Paragraph, Image, Video, Image row, Spacer
- Drag handle to reorder → updates `sort_order`
- Each block type shows a small tailored form (textarea, file upload, etc.)

---

## Implementation phases

### Phase 1 — Foundation
- [ ] Create Supabase project, tables, RLS policies, storage buckets
- [ ] Seed `site_settings`, `nav_items`, migrate current 5 projects
- [ ] `useSiteSettings`, `useNavItems`, `useProjects` hooks
- [ ] Wire `Layout`, `WorkPage`, `ProjectCover` to live data
- [ ] Dynamic route `/:slug` + `single_column` template only

### Phase 2 — Templates + media
- [ ] Remaining templates (`multi_column`, `alternating`, `full_bleed`, `video_gallery`)
- [ ] Block components + `ProjectPage` renderer
- [ ] Video cover support on grid
- [ ] Admin: project editor with block builder

### Phase 3 — Admin + auth
- [ ] `/admin/login` and protected layout
- [ ] Site settings + nav CRUD
- [ ] Project CRUD + file uploads
- [ ] Publish/draft workflow

### Phase 4 — Inquiry + polish
- [ ] Inquiry form → `inquiries` table
- [ ] Admin inquiry inbox
- [ ] SEO fields, Open Graph images per project
- [ ] Deploy to Vercel + Cloudflare DNS

---

## Vercel + env vars

Set in Vercel project settings (and local `.env`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Admin uses the same anon key; RLS restricts writes to authenticated users. Never expose the service role key in the frontend.

---

## Open decisions (to confirm before build)

1. **URL shape** — flat `/:slug` vs prefixed `/work/:slug` (flat is closer to the current example)
2. **Single vs multiple nav extras** — keep two fixed slots or allow N nav items in v1
3. **Logo** — text-only, image-only, or both with text fallback
4. **Draft preview** — secret preview link for unpublished projects, or admin-only view

Once these are settled, Phase 1 can start with migrations and hooking up the Work page grid.
