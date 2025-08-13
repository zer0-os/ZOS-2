import { useMatrix } from '@/hooks/useMatrix';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Component to display Matrix integration status
 * Useful for debugging and showing Matrix connection state
 */
export function MatrixStatus() {
  const { matrixStatus, matrixToken, getMatrixConfig } = useMatrix();

  const config = getMatrixConfig();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            matrixStatus.ready ? 'bg-green-500' : 'bg-red-500'
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
            <span className="text-muted-foreground">Authenticated:</span>
            <span className={matrixStatus.authenticated ? 'text-green-600' : 'text-red-600'}>
              {matrixStatus.authenticated ? '✅' : '❌'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Has Token:</span>
            <span className={matrixStatus.hasToken ? 'text-green-600' : 'text-red-600'}>
              {matrixStatus.hasToken ? '✅' : '❌'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valid Token:</span>
            <span className={matrixStatus.validToken ? 'text-green-600' : 'text-red-600'}>
              {matrixStatus.validToken ? '✅' : '❌'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ready:</span>
            <span className={matrixStatus.ready ? 'text-green-600' : 'text-red-600'}>
              {matrixStatus.ready ? '✅' : '❌'}
            </span>
          </div>
        </div>

        {matrixStatus.ready && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                <strong>Homeserver:</strong> {config.homeserverUrl}
              </div>
              <div>
                <strong>Token:</strong> {matrixToken ? `${matrixToken.slice(0, 10)}...` : 'None'}
              </div>
            </div>
          </div>
        )}

        {!matrixStatus.ready && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {!matrixStatus.authenticated 
                ? 'Please log in to enable Matrix features'
                : !matrixStatus.hasToken 
                ? 'Matrix SSO token not available'
                : 'Matrix integration not ready'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
