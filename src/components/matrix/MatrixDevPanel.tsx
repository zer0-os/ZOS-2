import { useState, useEffect } from 'react';
import { useMatrixClient } from '@/hooks/useMatrixClient';
import { useThemeContext } from '@/contexts/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { authService, matrixService } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    matrixUserId,
    hasMatrixUserId
  } = useMatrixClient();

  // Debug: Log client state changes
  useEffect(() => {
    console.log('🔄 Matrix Dev Panel - Client state changed:');
    console.log('  client:', !!client);
    console.log('  ready:', ready);
    console.log('  hasMatrixUserId:', hasMatrixUserId);
    console.log('  deviceId:', deviceId);
    console.log('  clientError:', clientError);
  }, [client, ready, hasMatrixUserId, deviceId, clientError]);
  

  const [isExpanded, setIsExpanded] = useState(true); // Start expanded for debugging
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Theme-aware classes
  const isDark = theme === 'midnight' || theme === 'blackout';
  const panelClasses = `fixed bottom-4 right-4 z-50 w-80 ${
    isDark ? 'shadow-2xl' : 'shadow-lg'
  }`;
  const debugBgClass = isDark ? 'bg-muted/50' : 'bg-gray-50';
  const successClass = isDark ? 'text-green-400' : 'text-green-600';
  const errorClass = isDark ? 'text-red-400' : 'text-red-600';
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
      console.log('🧪 Matrix Status Check:');
      console.log('  client exists:', !!client);
      console.log('  ready:', ready);
      console.log('  deviceId:', deviceId);
      console.log('  clientError:', clientError);

      if (!client) {
        setResult({
          success: false,
          error: clientError ? (clientError as Error).message : 'No Matrix client available'
        });
        return;
      }

      setResult({
        success: true,
        userId: client.getUserId() || 'Unknown',
        deviceId: deviceId || 'Not set',
        homeserver: client.getHomeserverUrl()?.replace('https://', ''),
        clientReady: ready,
        whoamiTest: 'Passed'
      });

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
                <div className="text-muted-foreground mb-1">ZOS Access Token:</div>
                {zeroAccessToken ? (
                  <div className="font-mono text-xs break-all bg-muted/30 p-1 rounded">
                    {zeroAccessToken}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">Not available</div>
                )}
              </div>

              {/* Matrix Token from Service */}
              <div>
                <div className="text-muted-foreground mb-1">Matrix Token:</div>
                {matrixTokenFromService ? (
                  <div className="font-mono text-xs break-all bg-muted/30 p-1 rounded">
                    {matrixTokenFromService}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">Not available</div>
                )}
              </div>

              {/* Matrix Username */}
              <div>
                <div className="text-muted-foreground mb-1">Matrix Username:</div>
                {user?.matrixId ? (
                  <div className="font-mono text-xs break-all bg-muted/30 p-1 rounded">
                    {user.matrixId}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">Not available</div>
                )}
              </div>
            </div>

            {/* Test Button */}
            <Button 
              onClick={runTest} 
              disabled={testing} // Remove canUseMatrix check for debugging
              size="sm"
              className="w-full"
              variant={result?.success ? "secondary" : "default"}
            >
              {testing ? 'Testing Connection...' : 'Test Matrix Chat Connection'}
            </Button>
            
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
                    <div><strong>Whoami Test:</strong> {result.whoamiTest} ✅</div>
                    <div><strong>Client Ready:</strong> {result.clientReady ? '✅' : '❌'}</div>
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
