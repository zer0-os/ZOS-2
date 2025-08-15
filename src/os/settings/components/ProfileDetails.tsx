import React from 'react';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ProfileDetailsProps {
  user?: any;
  onBack: () => void;
}

export const ProfileDetails: React.FC<ProfileDetailsProps> = ({ user, onBack }) => {
  // Use Zero.tech user data structure
  const displayName = user?.profileSummary?.firstName 
    ? `${user.profileSummary.firstName} ${user.profileSummary.lastName || ''}`.trim()
    : user?.handle 
    ? user.handle.replace('@zero.tech', '')
    : user?.profileSummary?.primaryEmail 
    ? user.profileSummary.primaryEmail
    : user?.name || user?.username || user?.email || 'User';

  return (
    <Card className="border-0 shadow-none flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium">Profile Details</h3>
      </div>
      
      <div className="p-6 flex-1">
        <div className="space-y-6">
          <div>
            <label className="text-sm text-muted-foreground">Name</label>
            <p className="text-sm mt-1">{displayName}</p>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="text-sm mt-1">{user?.profileSummary?.primaryEmail || user?.handle || user?.email || 'No email'}</p>
          </div>
          
          {user?.primaryZID && (
            <div>
              <label className="text-sm text-muted-foreground">ZID</label>
              <p className="text-sm mt-1">{user.primaryZID}</p>
            </div>
          )}
          
          {user?.profileId && (
            <div>
              <label className="text-sm text-muted-foreground">Profile ID</label>
              <p className="text-sm mt-1">{user.profileId}</p>
            </div>
          )}
          
          {user?.matrixId && (
            <div>
              <label className="text-sm text-muted-foreground">Matrix ID</label>
              <p className="text-sm mt-1">{user.matrixId}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};