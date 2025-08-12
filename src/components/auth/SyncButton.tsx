import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useSync } from '@/hooks/useAuth';
import { RefreshCw } from 'lucide-react';

interface SyncButtonProps {
  className?: string;
}

export const SyncButton: React.FC<SyncButtonProps> = ({ className = '' }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [showInput, setShowInput] = useState(false);
  const syncMutation = useSync();

  const handleSync = async () => {
    if (showInput && inviteCode.trim()) {
      await syncMutation.mutateAsync({ inviteCode: inviteCode.trim() });
      setInviteCode('');
      setShowInput(false);
    } else if (!showInput) {
      await syncMutation.mutateAsync({});
    }
  };

  const toggleInput = () => {
    setShowInput(!showInput);
    if (showInput) {
      setInviteCode('');
    }
  };

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Sync Account</h3>
          <p className="text-xs text-muted-foreground">
            Sync your account data with an invite code
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleInput}
        >
          {showInput ? 'Cancel' : 'With Invite'}
        </Button>
      </div>

      {showInput && (
        <div className="space-y-2">
          <Input
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            disabled={syncMutation.isPending}
          />
        </div>
      )}

      <Button
        onClick={handleSync}
        disabled={syncMutation.isPending || (showInput && !inviteCode.trim())}
        className="w-full"
        size="sm"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
        {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
      </Button>

      {syncMutation.error && (
        <div className="p-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded">
          {syncMutation.error.message}
        </div>
      )}

      {syncMutation.isSuccess && (
        <div className="p-2 text-xs text-success bg-success/10 border border-success/20 rounded">
          Account synced successfully!
        </div>
      )}
    </Card>
  );
};
