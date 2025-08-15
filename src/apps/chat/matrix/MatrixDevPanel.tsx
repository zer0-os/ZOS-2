import { useState } from 'react';
import { useServices } from '@/kernel/providers/ServicesProvider';
import { useThemeContext } from '@/os/theme/ThemeProvider';
import { useAuthStore } from '@/kernel/auth/store/authStore';
import { authService, matrixService } from '@/network';
import { matrixSessionBinder } from '@/kernel/matrix/MatrixSessionBinder';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { MessageSquare, ChevronDown, ChevronUp, Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Floating Matrix development panel for displaying session information
 * This is a pure display component - no client management or syncing
 */
export function MatrixDevPanel() {
  const { theme } = useThemeContext();
  const user = useAuthStore((state) => state.user);
  
  // Get tokens from different sources to debug
  const zeroAccessToken = authService.getCurrentToken();
  const matrixTokenFromService = matrixService.getCurrentMatrixToken();

  // Use existing services and session
  const services = useServices();
  const currentSession = matrixSessionBinder.getCurrentSession();
  
  // Extract values from session
  const ready = services.isReady;
  const clientError = services.error;
  const hasSession = !!currentSession;
  const deviceId = currentSession?.driver.getState().deviceId || null;
  const syncState = currentSession?.driver.getClient()?.getSyncState() || 'STOPPED';
  const hasMatrixUserId = !!user?.matrixId;

  const [isExpanded, setIsExpanded] = useState(true); // Start expanded for debugging
  const [showZosToken, setShowZosToken] = useState(false);
  const [showMatrixToken, setShowMatrixToken] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);

  // Theme-aware classes
  const isDark = theme === 'midnight' || theme === 'blackout';
  const panelClasses = `fixed bottom-4 right-4 z-50 w-80 ${
    isDark ? 'shadow-2xl' : 'shadow-lg'
  }`;
  const debugBgClass = isDark ? 'bg-muted/50' : 'bg-gray-50';

  const warningBgClass = isDark 
    ? 'text-yellow-300 bg-yellow-900/20 border border-yellow-800/30' 
    : 'text-yellow-700 bg-yellow-50 border border-yellow-200';
  const successBgClass = isDark 
    ? 'bg-green-900/30 border border-green-700/50 text-green-300'
    : 'bg-green-50 border border-green-200 text-green-800';
  const errorBgClass = isDark
    ? 'bg-red-900/30 border border-red-700/50 text-red-300'
    : 'bg-red-50 border border-red-200 text-red-800';
  const infoBgClass = isDark
    ? 'bg-blue-900/30 border border-blue-700/50 text-blue-300'
    : 'bg-blue-50 border border-blue-200 text-blue-800';

  // Get room information from existing session
  const getRoomInfo = () => {
    if (!currentSession?.driver.getClient()) return null;
    
    const client = currentSession.driver.getClient();
    if (!client) return null;
    
    const rooms = client.getRooms();
    const joinedRooms = rooms.filter((room: any) => room.getMyMembership() === 'join');
    
    // Sort by bumpStamp to get most recent
    const recentRooms = joinedRooms
      .sort((a: any, b: any) => {
        // @ts-ignore
        const stampA = a.getBumpStamp?.() ?? a.getLastActiveTimestamp() ?? 0;
        // @ts-ignore
        const stampB = b.getBumpStamp?.() ?? b.getLastActiveTimestamp() ?? 0;
        return stampB - stampA;
      })
      .slice(0, 5); // Just show top 5 for display
    
    return {
      totalRooms: rooms.length,
      joinedRooms: joinedRooms.length,
      recentRooms: recentRooms.map((room: any) => ({
        name: room.name || room.roomId,
        id: room.roomId,
        encrypted: room.hasEncryptionStateEvent?.() || false,
        memberCount: room.getJoinedMemberCount(),
        // @ts-ignore
        bumpStamp: room.getBumpStamp?.() || 0
      }))
    };
  };

  const roomInfo = showRoomInfo ? getRoomInfo() : null;

  return (
    <div className={panelClasses}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Matrix Dev Panel
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-3 pt-0">
            {/* Session Status */}
            <div className={`p-2 rounded text-xs ${hasSession ? successBgClass : errorBgClass}`}>
              <div className="flex items-center gap-2">
                {hasSession ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                <span className="font-medium">Session: {hasSession ? 'Active' : 'None'}</span>
              </div>
            </div>

            {/* Connection Info */}
            <div className={`${debugBgClass} p-2 rounded space-y-1 text-xs`}>
              <div className="font-medium mb-1">Connection Status</div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ready:</span>
                <span className={ready ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {ready ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sync State:</span>
                <span className={syncState === 'PREPARED' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                  {syncState}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Device ID:</span>
                <span className="font-mono text-[10px]">{deviceId ? `${deviceId.slice(0, 12)}...` : 'None'}</span>
              </div>
              {clientError && (
                <div className="text-red-600 dark:text-red-400 text-[10px] mt-1">
                  Error: {clientError}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className={`${debugBgClass} p-2 rounded space-y-1 text-xs`}>
              <div className="font-medium mb-1">User Info</div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Matrix ID:</span>
                <span className="font-mono text-[10px] truncate max-w-[150px]">
                  {user?.matrixId || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Has Matrix User:</span>
                <span className={hasMatrixUserId ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {hasMatrixUserId ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Token Status */}
            <div className={`${debugBgClass} p-2 rounded space-y-1 text-xs`}>
              <div className="font-medium mb-1">Token Status</div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ZOS Token:</span>
                  <div className="flex items-center gap-1">
                    <span className={zeroAccessToken ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {zeroAccessToken ? 'Present' : 'Missing'}
                    </span>
                    {zeroAccessToken && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowZosToken(!showZosToken)}
                        className="h-4 px-1 text-[10px]"
                      >
                        {showZosToken ? 'Hide' : 'Show'}
                      </Button>
                    )}
                  </div>
                </div>
                {showZosToken && zeroAccessToken && (
                  <div className="font-mono text-[10px] break-all bg-background/50 p-1 rounded">
                    {zeroAccessToken.substring(0, 50)}...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Matrix Token:</span>
                  <div className="flex items-center gap-1">
                    <span className={matrixTokenFromService ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                      {matrixTokenFromService ? 'Cached' : 'Not cached'}
                    </span>
                    {matrixTokenFromService && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMatrixToken(!showMatrixToken)}
                        className="h-4 px-1 text-[10px]"
                      >
                        {showMatrixToken ? 'Hide' : 'Show'}
                      </Button>
                    )}
                  </div>
                </div>
                {showMatrixToken && matrixTokenFromService && (
                  <div className="font-mono text-[10px] break-all bg-background/50 p-1 rounded">
                    {matrixTokenFromService.substring(0, 50)}...
                  </div>
                )}
              </div>
            </div>

            {/* Room Info Button */}
            {hasSession && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRoomInfo(!showRoomInfo)}
                className="w-full text-xs"
              >
                <Info className="w-3 h-3 mr-1" />
                {showRoomInfo ? 'Hide' : 'Show'} Room Info
              </Button>
            )}

            {/* Room Information */}
            {showRoomInfo && roomInfo && (
              <div className={`${infoBgClass} p-2 rounded space-y-2 text-xs`}>
                <div className="font-medium">Room Statistics</div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Rooms:</span>
                  <span>{roomInfo.totalRooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined Rooms:</span>
                  <span>{roomInfo.joinedRooms}</span>
                </div>
                
                {roomInfo.recentRooms.length > 0 && (
                  <>
                    <div className="font-medium mt-2">Top 5 Recent Rooms</div>
                    <div className="space-y-1">
                      {roomInfo.recentRooms.map((room, idx) => (
                        <div key={room.id} className="text-[10px] space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">{idx + 1}.</span>
                            <span className="truncate flex-1">{room.name}</span>
                            {room.encrypted && <span title="Encrypted">🔒</span>}
                          </div>
                          <div className="pl-4 text-muted-foreground">
                            {room.memberCount} members • Bump: {room.bumpStamp}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Warning about dev panel */}
            <div className={`${warningBgClass} p-2 rounded text-[10px]`}>
              <div className="flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  This panel displays current Matrix session information. 
                  No client management or syncing is performed here.
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}