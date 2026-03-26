import { redirect } from 'next/navigation';

// Convention: new entities are created via modal dialogs, not separate /new pages.
// Redirect to inventory list with ?action=create to open the AssetCreateDialog.
export default function NewAssetPage() {
  redirect('/inventory?action=create');
}
