
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notificationService } from '@/lib/firebase/notification-service';
import { Bell, Volume2, VolumeX, TestTube } from 'lucide-react';

export default function VendorNotificationTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testNotificationPermission = async () => {
    setIsTesting(true);
    addTestResult('Testing notification permission...');

    try {
      const permission = Notification.permission;
      addTestResult(`Current permission: ${permission}`);

      if (permission === 'default') {
        const granted = await notificationService.requestPermission();
        addTestResult(`Permission request result: ${granted ? 'GRANTED' : 'DENIED'}`);
      } else if (permission === 'granted') {
        addTestResult('Permission already granted');
      } else {
        addTestResult('Permission denied');
      }
    } catch (error) {
      addTestResult(`Error: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Vendor Notification Test
          </CardTitle>
          <CardDescription>
            Test notification permissions and functionality for vendors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={testNotificationPermission}
              disabled={isTesting}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {isTesting ? 'Testing...' : 'Test Permission'}
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Results:</h4>
              <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
