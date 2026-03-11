---
phase: quick-40
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(dashboard)/inventory/page.tsx
  - components/assets/asset-columns.tsx
  - components/assets/asset-table.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Each row in the asset table shows a photo thumbnail (or placeholder icon) in the same position as the request table"
    - "Clicking the thumbnail opens the photo in a lightbox"
    - "Rows with no condition photo show the dashed placeholder icon"
    - "The thumbnail shows the latest asset_creation or asset_status_change photo"
  artifacts:
    - path: "app/(dashboard)/inventory/page.tsx"
      provides: "Batch-fetches latest condition photo per asset and passes photosByAsset map to AssetTable"
    - path: "components/assets/asset-columns.tsx"
      provides: "Photo column definition identical in style to request-columns photo column"
    - path: "components/assets/asset-table.tsx"
      provides: "Accepts photosByAsset prop, passes to DataTable meta, wires onPhotoClick to lightbox"
  key_links:
    - from: "app/(dashboard)/inventory/page.tsx"
      to: "components/assets/asset-table.tsx"
      via: "photosByAsset prop"
      pattern: "photosByAsset"
    - from: "components/assets/asset-table.tsx"
      to: "components/assets/asset-columns.tsx"
      via: "DataTable meta.photosByAsset + meta.onPhotoClick"
      pattern: "photosByAsset.*onPhotoClick"
---

<objective>
Add a photo thumbnail column to the asset table list, matching the existing photo column in the request table.

Purpose: Gives users a quick visual preview of each asset's latest condition photo directly in the list, matching the established request table pattern.
Output: Asset rows show a 40x40px clickable thumbnail (or dashed placeholder) for the latest condition/creation photo.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Key pattern reference — request table photo implementation:
- `app/(dashboard)/requests/page.tsx` batch-fetches from `media_attachments` (entity_type='request'), generates signed URLs, builds `photosByRequest: Record<string, {id,url,fileName}[]>`, passes to `RequestTable`
- `components/requests/request-table.tsx` receives `photosByRequest`, passes to `DataTable` meta alongside `onPhotoClick`
- `components/requests/request-columns.tsx` reads `meta.photosByRequest?.[row.original.id]` and renders thumbnail

Asset photo storage:
- Bucket: `asset-photos`
- Table: `media_attachments`
- Condition photos: entity_type IN ('asset_creation', 'asset_status_change'), entity_id = asset UUID
- The latest photo = most recent `created_at` record per asset

PhotoLightbox component (already used by asset-detail-info.tsx and asset-timeline.tsx):
- Import path: `@/components/requests/request-photo-lightbox`
- Props: `photos: PhotoItem[], initialIndex: number, onClose: () => void`
</context>

<interfaces>
<!-- From components/requests/request-columns.tsx — photo column pattern to replicate exactly -->
```typescript
// PhotoItem type
interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

// RequestTableMeta shape
export type RequestTableMeta = {
  onPhotoClick?: (photos: PhotoItem[], index: number) => void;
  photosByRequest?: Record<string, PhotoItem[]>;
  // ...
};

// Photo column cell (id: 'photo', size: 50)
// - If photos.length === 0: dashed placeholder with ImageIcon
// - If photos.length > 0: clickable <button> with <img className="h-full w-full object-cover" />, calls meta.onPhotoClick
// - Badge overlay shows count if photos.length > 1
```

<!-- From components/assets/asset-table.tsx -->
```typescript
interface AssetTableProps {
  data: InventoryItemWithRelations[];
  pendingTransfers: Record<string, PendingTransfer>;
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  gaUsers: GAUserWithLocation[];
  currentUserId: string;
  currentUserRole: string;
  initialViewId?: string;
}
// DataTable meta currently: { onView, onTransfer, pendingTransfers, currentUserRole }
```

<!-- From app/(dashboard)/inventory/page.tsx -->
```typescript
// Assets fetched from 'inventory_items' — no photos fetched today
// assetList: InventoryItemWithRelations[]
// Pattern to add (mirrors requests/page.tsx lines 79-120):
//   1. collect assetIds from assetList (already computed above for pendingMovements)
//   2. query media_attachments WHERE entity_type IN ('asset_creation','asset_status_change')
//      AND entity_id IN (assetIds) AND deleted_at IS NULL ORDER BY created_at DESC
//   3. createSignedUrls from 'asset-photos' bucket with 21600s expiry
//   4. group into photosByAsset: Record<string, PhotoItem[]>  (keep all, latest first = DESC order)
//   5. pass photosByAsset to <AssetTable>
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Fetch condition photos in inventory page and wire through to asset table column</name>
  <files>app/(dashboard)/inventory/page.tsx, components/assets/asset-table.tsx, components/assets/asset-columns.tsx</files>
  <action>
**Step A — inventory/page.tsx:** After the `pendingTransfersMap` block and before the return, add a batch photo fetch block:
1. Build `assetIds` from `assetList.map((a) => a.id)` (the same list used for pendingMovements, now reused).
2. If `assetIds.length > 0`, query `media_attachments`: entity_type IN ('asset_creation', 'asset_status_change'), entity_id IN assetIds, deleted_at IS NULL, order by created_at DESC.
3. Call `supabase.storage.from('asset-photos').createSignedUrls(attachments.map(a => a.file_path), 21600)`.
4. Build `photosByAsset: Record<string, { id: string; url: string; fileName: string }[]>` grouped by entity_id (same structure as `photosByRequest` in requests/page.tsx).
5. Pass `photosByAsset` as a new prop to `<AssetTable photosByAsset={photosByAsset} ...>`.

**Step B — asset-table.tsx:** Add to `AssetTableProps`:
- `photosByAsset: Record<string, { id: string; url: string; fileName: string }[]>`

Add `PhotoItem` type alias: `type PhotoItem = { id: string; url: string; fileName: string }`.

Add lightbox state (same pattern as request-table.tsx):
```
const [lightboxPhotos, setLightboxPhotos] = useState<PhotoItem[]>([]);
const [lightboxIndex, setLightboxIndex] = useState(0);
const [lightboxOpen, setLightboxOpen] = useState(false);

const handlePhotoClick = (photos: PhotoItem[], index: number) => {
  setLightboxPhotos(photos);
  setLightboxIndex(index);
  setLightboxOpen(true);
};
```

Pass through `DataTable` meta:
```
meta={{
  onView: handleView,
  onTransfer: handleTransfer,
  pendingTransfers,
  currentUserRole,
  photosByAsset,
  onPhotoClick: handlePhotoClick,
}}
```

Render lightbox after the DataTable:
```
import { PhotoLightbox } from '@/components/requests/request-photo-lightbox';
...
{lightboxOpen && lightboxPhotos.length > 0 && (
  <PhotoLightbox
    photos={lightboxPhotos}
    initialIndex={lightboxIndex}
    onClose={() => setLightboxOpen(false)}
  />
)}
```

**Step C — asset-columns.tsx:** Add `PhotoItem` type and extend `AssetTableMeta`:
```typescript
interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

export type AssetTableMeta = {
  onView?: (asset: InventoryItemWithRelations) => void;
  onTransfer?: (asset: InventoryItemWithRelations) => void;
  pendingTransfers?: Record<string, PendingTransfer>;
  currentUserRole?: string;
  photosByAsset?: Record<string, PhotoItem[]>;
  onPhotoClick?: (photos: PhotoItem[], index: number) => void;
};
```

Add `import { ImageIcon } from 'lucide-react';` to the imports.

Insert a photo column after the `display_id` column (at index 1 in the array):
```typescript
{
  id: 'photo',
  header: '',
  cell: ({ row, table }) => {
    const meta = table.options.meta as AssetTableMeta | undefined;
    const photos = meta?.photosByAsset?.[row.original.id] ?? [];

    if (photos.length === 0) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-dashed border-muted-foreground/25">
          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
        </div>
      );
    }

    return (
      <button
        type="button"
        className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-border hover:opacity-80 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          meta?.onPhotoClick?.(photos, 0);
        }}
        aria-label={`View ${photos.length} photo${photos.length > 1 ? 's' : ''}`}
      >
        <img
          src={photos[0].url}
          alt={photos[0].fileName}
          className="h-full w-full object-cover"
        />
        {photos.length > 1 && (
          <span className="absolute bottom-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-tl bg-black/70 px-0.5 text-[10px] font-medium text-white">
            {photos.length}
          </span>
        )}
      </button>
    );
  },
  size: 50,
  enableSorting: false,
},
```
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
- `npm run build` passes with no TypeScript errors.
- Asset table renders a 40x40 thumbnail column between display_id and name columns.
- Assets with condition photos show a clickable thumbnail; clicking opens a lightbox.
- Assets without photos show the dashed ImageIcon placeholder.
- Visual placement and styling matches the request table photo column exactly.
  </done>
</task>

</tasks>

<verification>
1. `npm run build` — zero errors
2. Navigate to /inventory — photo column appears between ID and Name columns
3. Row with photo: thumbnail visible, click opens lightbox
4. Row without photo: dashed placeholder with ImageIcon
5. Compare visually to /requests — identical thumbnail style and placement
</verification>

<success_criteria>
Asset table list shows a 40x40px photo thumbnail (or dashed placeholder) in each row, using the latest condition photo from media_attachments, identical in style and placement to the request table photo column.
</success_criteria>

<output>
After completion, create `.planning/quick/40-asset-table-list-display-latest-conditio/40-SUMMARY.md`
</output>
