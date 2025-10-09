
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
