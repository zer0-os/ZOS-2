import { useMatrixClient } from '@/hooks/useMatrixClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Component to display Matrix integration status
 * Useful for debugging and showing Matrix connection state
 */
export function MatrixStatus() {
  const { client, ready, error, matrixToken, matrixUserId, hasMatrixToken, hasMatrixUserId } = useMatrixClient();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            ready ? 'bg-green-500' : 'bg-red-500'
          }`} />
          Matrix Integration
        </CardTitle>
        <CardDescription>
          Status of Matrix chat integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Has Token:</span>
            <span className={hasMatrixToken ? 'text-green-600' : 'text-red-600'}>
              {hasMatrixToken ? '✅' : '❌'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Has User ID:</span>
            <span className={hasMatrixUserId ? 'text-green-600' : 'text-red-600'}>
              {hasMatrixUserId ? '✅' : '❌'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client Ready:</span>
            <span className={ready ? 'text-green-600' : 'text-red-600'}>
              {ready ? '✅' : '❌'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Error:</span>
            <span className={error ? 'text-red-600' : 'text-green-600'}>
              {error ? '❌' : '✅'}
            </span>
          </div>
        </div>

        {ready && client && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                <strong>Homeserver:</strong> {client.getHomeserverUrl()?.replace('https://', '')}
              </div>
              <div>
                <strong>User ID:</strong> {matrixUserId}
              </div>
              <div>
                <strong>Token:</strong> {matrixToken ? `${matrixToken.slice(0, 10)}...` : 'None'}
              </div>
            </div>
          </div>
        )}

        {!ready && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {!hasMatrixToken 
                ? 'Matrix SSO token not available'
                : !hasMatrixUserId 
                ? 'Matrix user ID not available'
                : error
                ? `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                : 'Matrix client initializing...'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
