import { useState } from 'react';
import * as sdk from "matrix-js-sdk";
import { useMatrixClient } from '@/drivers/matrix/MatrixProvider';
import { useThemeContext } from '@/os/theme/ThemeProvider';
import { useAuthStore } from '@/kernel/auth/store/authStore';
import { authService, matrixService } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Floating Matrix development panel for easy testing
 */
export function MatrixDevPanel() {
  const { theme } = useThemeContext();
  const user = useAuthStore((state) => state.user);
  
  // Get tokens from different sources to debug
  const zeroAccessToken = authService.getCurrentToken();
  const matrixTokenFromService = matrixService.getCurrentMatrixToken();
  const matrixTokenFromUser = user?.matrixAccessToken;

  // Use simplified Matrix client hook
  const { 
    client, 
    ready, 
    error: clientError, 
    deviceId,

    hasMatrixUserId
  } = useMatrixClient();

  const [isExpanded, setIsExpanded] = useState(true); // Start expanded for debugging
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showZosToken, setShowZosToken] = useState(false);
  const [showMatrixToken, setShowMatrixToken] = useState(false);

  // Theme-aware classes
  const isDark = theme === 'midnight' || theme === 'blackout';
  const panelClasses = `fixed bottom-4 right-4 z-50 w-80 ${
    isDark ? 'shadow-2xl' : 'shadow-lg'
  }`;
  const debugBgClass = isDark ? 'bg-muted/50' : 'bg-gray-50';

  const warningBgClass = isDark 
    ? 'text-yellow-300 bg-yellow-900/20 border border-yellow-800/30' 
    : 'text-yellow-700 bg-yellow-50 border border-yellow-200';
  const resultSuccessBg = isDark 
    ? 'bg-green-900/30 border border-green-700/50 text-green-300'
    : 'bg-green-50 border border-green-200 text-green-800';
  const resultErrorBg = isDark
    ? 'bg-red-900/30 border border-red-700/50 text-red-300'
    : 'bg-red-50 border border-red-200 text-red-800';

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      // Test 1: Check if we have tokens
      if (!zeroAccessToken) {
        setResult({
          success: false,
          error: 'No ZOS access token available'
        });
        return;
      }

      // Test 2: Check for existing Matrix SSO token or get new one
      console.log('🧪 Dev Panel: Checking Matrix SSO token...');
      let matrixToken = matrixTokenFromService; // Use existing token first
      
      if (!matrixToken) {
        console.log('🧪 Dev Panel: No existing token, requesting new SSO token...');
        try {
          const ssoResponse = await matrixService.getSSOToken(zeroAccessToken);
          matrixToken = ssoResponse.token;
          console.log('🧪 Dev Panel: New SSO token received:', matrixToken);
        } catch (ssoError) {
          setResult({
            success: false,
            error: `SSO Token Error: ${ssoError instanceof Error ? ssoError.message : String(ssoError)}`
          });
          return;
        }
      } else {
        console.log('🧪 Dev Panel: Using existing SSO token:', matrixToken);
      }

      // Test 3: Fetch recent messages
      const testClient = client || (matrixToken && user?.matrixId ? sdk.createClient({
        baseUrl: 'https://zos-home-2-e24b9412096f.herokuapp.com',
        accessToken: matrixToken,
        userId: user.matrixId,
      }) : null);

      if (testClient) {
        try {
          // Debug: Log client state
          console.log('🔍 Debug: Client state:', {
            isLoggedIn: testClient.isLoggedIn(),
            userId: testClient.getUserId(),
            deviceId: testClient.getDeviceId(),
            syncState: testClient.getSyncState()
          });

          // Start sync if not already syncing
          const currentSyncState = testClient.getSyncState();
          if (!currentSyncState || currentSyncState === 'STOPPED') {
            console.log('🔍 Debug: Starting Matrix sync...');
            await testClient.startClient({ initialSyncLimit: 5 });
            
            // Wait for initial sync to complete with longer timeout
            await new Promise((resolve) => {
              const timeout = setTimeout(() => {
                console.log('🔍 Debug: Sync timeout reached, proceeding anyway...');
                testClient.removeListener('sync' as any, onSync);
                resolve(undefined); // Don't reject, just proceed
              }, 30000); // Increased to 30 seconds
              
              const onSync = (state: string) => {
                console.log('🔍 Debug: Sync state changed to:', state);
                if (state === 'PREPARED' || state === 'SYNCING') {
                  clearTimeout(timeout);
                  testClient.removeListener('sync' as any, onSync);
                  console.log('🔍 Debug: Sync reached acceptable state:', state);
                  resolve(undefined);
                }
              };
              
              testClient.on('sync' as any, onSync);
              
              // Also check if we're already in a good state
              setTimeout(() => {
                const state = testClient.getSyncState();
                if (state === 'PREPARED' || state === 'SYNCING') {
                  clearTimeout(timeout);
                  testClient.removeListener('sync' as any, onSync);
                  console.log('🔍 Debug: Already in good sync state:', state);
                  resolve(undefined);
                }
              }, 1000);
            });
            
            console.log('🔍 Debug: Sync process completed, current state:', testClient.getSyncState());
          } else {
            console.log('🔍 Debug: Client already syncing, state:', currentSyncState);
          }

          // Get recent messages from joined rooms
          const rooms = testClient.getRooms();
          console.log('🔍 Debug: Total rooms found:', rooms.length);
          
          const joinedRooms = rooms.filter((room: any) => room.getMyMembership() === 'join');
          console.log('🔍 Debug: Joined rooms found:', joinedRooms.length);
          
          const recentMessages = [];
          
          // Check ALL joined rooms to ensure we get the true 20 most recent messages
          console.log('🔍 Debug: Rooms to check for messages:', joinedRooms.length);
          
          for (const room of joinedRooms) {
            try {
              console.log(`🔍 Debug: Checking room ${room.roomId} (${room.name || 'unnamed'})`);
              
              // Get room timeline events
              const timeline = room.getLiveTimeline();
              const events = timeline.getEvents();
              console.log(`🔍 Debug: Room ${room.roomId} has ${events.length} total events`);
              
              // Log event types for debugging
              const eventTypes = events.map((event: any) => event.getType());
              console.log(`🔍 Debug: Event types in room ${room.roomId}:`, [...new Set(eventTypes)]);
              
              // Filter for message events - get ALL messages, not just last 7
              const messageEvents = events
                .filter((event: any) => event.getType() === 'm.room.message')
                .map((event: any) => ({
                  roomId: room.roomId,
                  roomName: room.name || room.roomId,
                  sender: event.getSender(),
                  content: event.getContent().body || '[No content]',
                  timestamp: new Date(event.getTs()).toISOString(),
                  eventId: event.getId(),
                  timestampMs: event.getTs() // Keep original timestamp for sorting
                }));

              console.log(`🔍 Debug: Room ${room.roomId} has ${messageEvents.length} message events`);
              recentMessages.push(...messageEvents);
            } catch (roomError) {
              console.warn(`Failed to get messages from room ${room.roomId}:`, roomError);
            }
          }

          // If no messages found, try alternative approach using HTTP API
          if (recentMessages.length === 0 && joinedRooms.length > 0) {
            console.log('🔍 Debug: No messages found in timelines, trying HTTP API fetch...');
            
            for (const room of joinedRooms) {
              try {
                // Try to fetch messages via direct HTTP API
                const messagesUrl = `https://zos-home-2-e24b9412096f.herokuapp.com/_matrix/client/v3/rooms/${encodeURIComponent(room.roomId)}/messages?dir=b&limit=10`;
                const messagesResponse = await fetch(messagesUrl, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${matrixToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                });
                
                if (messagesResponse.ok) {
                  const messagesData = await messagesResponse.json();
                  console.log(`🔍 Debug: HTTP API messages for room ${room.roomId}:`, messagesData);
                  
                  if (messagesData && messagesData.chunk) {
                    const apiMessages = messagesData.chunk
                      .filter((event: any) => event.type === 'm.room.message')
                      .map((event: any) => ({
                        roomId: room.roomId,
                        roomName: room.name || room.roomId,
                        sender: event.sender,
                        content: event.content?.body || '[No content]',
                        timestamp: new Date(event.origin_server_ts).toISOString(),
                        eventId: event.event_id,
                        timestampMs: event.origin_server_ts // Keep original timestamp for sorting
                      }));
                    
                    console.log(`🔍 Debug: Found ${apiMessages.length} HTTP API messages in room ${room.roomId}`);
                    recentMessages.push(...apiMessages);
                  }
                } else {
                  console.warn(`HTTP API failed for room ${room.roomId}: ${messagesResponse.status}`);
                }
              } catch (apiError) {
                console.warn(`Failed to fetch HTTP API messages from room ${room.roomId}:`, apiError);
              }
            }
          }

          // Sort by timestamp (newest first) and get exactly the 20 most recent messages
          const sortedMessages = recentMessages
            .sort((a, b) => b.timestampMs - a.timestampMs) // Use numeric timestamp for accurate sorting
            .slice(0, 20) // Take exactly 20 most recent
            .map(msg => {
              // Remove timestampMs from final output (it was just for sorting)
              const { timestampMs, ...cleanMsg } = msg;
              return cleanMsg;
            });

          console.log('🔍 Debug: Total messages collected across all rooms:', recentMessages.length);
          console.log('🔍 Debug: Final 20 most recent messages selected:', sortedMessages.length);

          // Log the messages to console
          console.log('📬 20 Most Recent Messages:', sortedMessages);

          setResult({
            success: true,
            userId: user?.matrixId || 'Unknown',
            deviceId: deviceId || 'Not available',
            homeserver: 'zos-home-2-e24b9412096f.herokuapp.com',
            messagesTest: `${sortedMessages.length} messages logged`,
            clientReady: ready,
            hasClient: !!client
          });

        } catch (messagesError) {
          console.error('Failed to fetch recent messages:', messagesError);
          setResult({
            success: false,
            error: `Messages fetch failed: ${messagesError instanceof Error ? messagesError.message : String(messagesError)}`
          });
        }
      } else {
        setResult({
          success: false,
          error: `Missing requirements - Client: ${!!client}, Token: ${!!matrixToken}, User ID: ${!!user?.matrixId}`
        });
      }

    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className={panelClasses}>
      <Card className={`border ${isDark ? 'bg-card/95 backdrop-blur-sm' : 'bg-card'}`}>
        <CardHeader 
          className="pb-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Matrix Dev Panel
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CardTitle>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0 space-y-3">
            <div className={`text-xs space-y-2 ${debugBgClass} p-2 rounded`}>
              {/* ZOS Access Token */}
              <div>
                <div className="text-muted-foreground mb-1 flex items-center justify-between">
                  ZOS Access Token:
                  {zeroAccessToken && (
                    <Button
                      onClick={() => setShowZosToken(!showZosToken)}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      {showZosToken ? 'Hide Token' : 'Show Token'}
                    </Button>
                  )}
                </div>
                {zeroAccessToken ? (
                  <div className="space-y-1">
                    {showZosToken ? (
                      <div className="font-mono text-xs break-all bg-muted/30 p-1 rounded max-h-20 overflow-y-auto">
                        {zeroAccessToken}
                      </div>
                    ) : (
                      <div className="font-mono text-xs bg-muted/30 p-1 rounded text-muted-foreground">
                        ••••••••••••••••••••••••••••••••••••••••
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Length: {zeroAccessToken.length} chars
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500 italic">❌ Not available</div>
                )}
              </div>

              {/* Matrix Token from Service */}
              <div>
                <div className="text-muted-foreground mb-1 flex items-center justify-between">
                  Matrix Token:
                  {matrixTokenFromService && (
                    <Button
                      onClick={() => setShowMatrixToken(!showMatrixToken)}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      {showMatrixToken ? 'Hide Token' : 'Show Token'}
                    </Button>
                  )}
                </div>
                {matrixTokenFromService ? (
                  <div className="space-y-1">
                    {showMatrixToken ? (
                      <div className="font-mono text-xs break-all bg-muted/30 p-1 rounded max-h-20 overflow-y-auto">
                        {matrixTokenFromService}
                      </div>
                    ) : (
                      <div className="font-mono text-xs bg-muted/30 p-1 rounded text-muted-foreground">
                        ••••••••••••••••••••••••••••••••••••••••
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Length: {matrixTokenFromService.length} chars
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500 italic">❌ Not available</div>
                )}
              </div>

              {/* Matrix Username */}
              <div>
                <div className="text-muted-foreground mb-1">Matrix User ID:</div>
                {user?.matrixId ? (
                  <div className="space-y-1">
                    <div className="font-mono text-xs break-all bg-muted/30 p-1 rounded">
                      {user.matrixId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Format: {user.matrixId.startsWith('@') && user.matrixId.includes(':') ? '✅ Valid' : '❌ Invalid'}
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500 italic">❌ Not available</div>
                )}
              </div>

              {/* Client Status */}
              <div>
                <div className="text-muted-foreground mb-1">Client Status:</div>
                <div className="space-y-1 text-xs">
                  <div>Ready: {ready ? '✅' : '❌'}</div>
                  <div>Has Client: {client ? '✅' : '❌'}</div>
                  <div>Device ID: {deviceId || 'Not set'}</div>
                  {clientError ? (
                    <div className="text-red-500 mt-1">
                      Error: {String(clientError instanceof Error ? clientError.message : clientError)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={runTest} 
                disabled={testing} // Remove canUseMatrix check for debugging
                size="sm"
                className="w-full"
                variant={result?.success ? "secondary" : "default"}
              >
                {testing ? 'Testing Connection...' : 'Test Matrix Chat Connection'}
              </Button>
              
              {matrixTokenFromService && (
                <Button 
                  onClick={() => {
                    matrixService.clearMatrixToken();
                    console.log('🧹 Cleared cached Matrix token');
                    setResult(null);
                  }}
                  size="sm"
                  className="w-full"
                  variant="outline"
                >
                  Clear Cached Token
                </Button>
              )}
            </div>
            
            {(!matrixTokenFromService && !matrixTokenFromUser || !hasMatrixUserId) && (
              <div className={`text-xs p-2 rounded ${warningBgClass}`}>
                ⚠️ Matrix chat not ready - test button enabled for troubleshooting
              </div>
            )}

            {/* Results */}
            {result && (
              <div className={`p-2 rounded text-xs ${
                result.success ? resultSuccessBg : resultErrorBg
              }`}>
                <div className="font-semibold mb-1">
                  {result.success ? '✅ Success' : '❌ Failed'}
                </div>
                
                {result.success ? (
                  <div className="space-y-1">
                    <div><strong>Matrix Username:</strong> {result.userId}</div>
                    <div><strong>Device ID:</strong> {result.deviceId}</div>
                    <div><strong>Chat Server:</strong> {result.homeserver}</div>
                    {result.messagesTest && <div><strong>Messages Test:</strong> {result.messagesTest} ✅</div>}
                    <div><strong>Client Ready:</strong> {result.clientReady ? '✅' : '❌'}</div>
                    <div><strong>Has Client:</strong> {result.hasClient ? '✅' : '❌'}</div>
                  </div>
                ) : (
                  <div><strong>Error:</strong> {result.error}</div>
                )}
              </div>
            )}

            {!ready && (
              <div className="text-xs text-muted-foreground">
                💬 Matrix client initializing...
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
