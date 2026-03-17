---
phase: quick
plan: 260317-lqo
type: execute
wave: 1
depends_on: []
files_modified:
  - components/media/photo-lightbox.tsx
autonomous: true
requirements: [QUICK-LIGHTBOX-Z-INDEX]
must_haves:
  truths:
    - "PhotoLightbox uses z-[60] instead of z-50 to render above Dialog overlays"
  artifacts:
    - path: "components/media/photo-lightbox.tsx"
      provides: "Higher z-index for lightbox"
      contains: "z-[60]"
  key_links: []
---
<objective>Fix photo lightbox rendering behind modals by bumping z-index above Dialog's z-50.</objective>
<tasks>
<task type="auto">
  <name>Task 1: Bump z-index</name>
  <files>components/media/photo-lightbox.tsx</files>
  <action>Change z-50 to z-[60]</action>
  <verify><automated>npx tsc --noEmit</automated></verify>
  <done>PhotoLightbox renders above all Dialog overlays</done>
</task>
</tasks>
