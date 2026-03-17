---
plan: 260317-lqo
status: complete
commits:
  - hash: "15c7cc1"
    message: "fix(quick-260317-lqo): bump PhotoLightbox z-index to z-[60]"
---
# Quick Task 260317-lqo: Summary
Changed `z-50` to `z-[60]` on the PhotoLightbox fixed overlay. Dialog uses z-50, so lightbox now renders above it. Only one component affected — `request-photo-lightbox.tsx` uses Radix Dialog which handles portal stacking automatically.
## Tasks: 1/1
