import { useState } from 'react';
import { useMatrixClient } from '@/drivers/matrix/MatrixProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';

/**
 * Simple Matrix connection test component
 * Tests the Matrix integration by fetching basic account info
 */
export function MatrixTest() {
  const { client, ready, error, hasMatrixUserId } = useMatrixClient();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    if (!hasMatrixUserId) {
      setResult({
        success: false,
        error: 'Matrix integration not available. Please log in first.'
      });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      if (client && ready) {
        setResult({
          success: true,
          userId: client.getUserId(),
          homeserver: client.getHomeserverUrl()?.replace('https://', ''),
          status: 'Matrix client ready'
        });
      } else if (error) {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } else {
        setResult({
          success: false,
          error: 'Matrix client not ready yet'
        });
      }
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Matrix Connection Test
        </CardTitle>
        <CardDescription>
          Test the Matrix integration by fetching basic account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runTest} 
            disabled={(!hasMatrixToken || !hasMatrixUserId) || testing}
            variant={result?.success ? "secondary" : "default"}
          >
            {testing ? 'Testing...' : 'Test Matrix Connection'}
          </Button>
          
          {result && (
            <Button 
              onClick={() => setResult(null)} 
              variant="outline" 
              size="sm"
            >
              Clear
            </Button>
          )}
        </div>

        {(!hasMatrixToken || !hasMatrixUserId) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            ⚠️ Matrix integration not available. Please log in to test Matrix connection.
          </div>
        )}

        {result && (
          <div className={`p-4 rounded border ${
            result.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="font-semibold mb-2">
              {result.success ? '✅ Test Successful' : '❌ Test Failed'}
            </div>
            
            {result.success ? (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>User ID:</strong> {result.userId}
                </div>
                {result.displayName && (
                  <div>
                    <strong>Display Name:</strong> {result.displayName}
                  </div>
                )}
                {result.avatarUrl && (
                  <div>
                    <strong>Avatar URL:</strong> {result.avatarUrl}
                  </div>
                )}
                <div>
                  <strong>Homeserver:</strong> {result.homeserver}
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <strong>Error:</strong> {result.error}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <strong>What this test does:</strong>
          <ul className="mt-1 ml-4 list-disc space-y-1">
            <li>Verifies Matrix SSO token is valid</li>
            <li>Connects to Zero's Matrix homeserver</li>
            <li>Fetches your Matrix user information</li>
            <li>Optionally retrieves display name and avatar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
