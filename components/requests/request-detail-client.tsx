'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequestWithRelations } from '@/lib/types/database';
import { RequestDetailInfo } from './request-detail-info';
import { RequestDetailActions } from './request-detail-actions';
import { RequestTimeline, TimelineEvent } from './request-timeline';

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

interface RequestDetailClientProps {
  request: RequestWithRelations;
  photoUrls: PhotoItem[];
  timelineEvents: TimelineEvent[];
  categories: { id: string; name: string }[];
  users: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
}

export function RequestDetailClient({
  request,
  photoUrls,
  timelineEvents,
  categories,
  users,
  locations,
  currentUserId,
  currentUserRole,
}: RequestDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const handleActionSuccess = () => {
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
      {/* Left column: info + actions */}
      <div className="space-y-6">
        <RequestDetailInfo
          request={request}
          photoUrls={photoUrls}
          categories={categories}
          users={users}
          locations={locations}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isEditing={isEditing}
          onEditToggle={() => {
            setIsEditing(!isEditing);
            if (isEditing) {
              // After successful edit, refresh server data
              router.refresh();
            }
          }}
          onTriageSuccess={handleActionSuccess}
        />

        {!isEditing && (
          <RequestDetailActions
            request={request}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onEdit={() => setIsEditing(true)}
            onActionSuccess={handleActionSuccess}
          />
        )}
      </div>

      {/* Right column: timeline */}
      <div>
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold mb-4">Activity Timeline</h2>
          <RequestTimeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
}
