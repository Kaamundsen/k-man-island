'use client';

import { useState, useEffect, useCallback } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    setIsSupported('Notification' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(
    (options: NotificationOptions): Notification | null => {
      if (!isSupported || permission !== 'granted') {
        console.warn('Notifications not available or not permitted');
        return null;
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon.png',
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
        });

        // Auto-close after 5 seconds if not requiring interaction
        if (!options.requireInteraction) {
          setTimeout(() => notification.close(), 5000);
        }

        return notification;
      } catch (error) {
        console.error('Error creating notification:', error);
        return null;
      }
    },
    [isSupported, permission]
  );

  // Pre-defined notification types
  const notifyPriceAlert = useCallback(
    (ticker: string, price: number, targetPrice: number, isAbove: boolean) => {
      return sendNotification({
        title: `🚨 Prisvarsel: ${ticker}`,
        body: `${ticker} har ${isAbove ? 'steget over' : 'falt under'} ${targetPrice.toFixed(2)} kr (nå: ${price.toFixed(2)} kr)`,
        tag: `price-alert-${ticker}`,
        requireInteraction: true,
      });
    },
    [sendNotification]
  );

  const notifyStopLoss = useCallback(
    (ticker: string, price: number, stopLoss: number) => {
      return sendNotification({
        title: `⛔ STOP LOSS: ${ticker}`,
        body: `${ticker} har nådd stop loss på ${stopLoss.toFixed(2)} kr. Nåværende pris: ${price.toFixed(2)} kr`,
        tag: `stop-loss-${ticker}`,
        requireInteraction: true,
      });
    },
    [sendNotification]
  );

  const notifyTargetHit = useCallback(
    (ticker: string, price: number, target: number) => {
      return sendNotification({
        title: `🎯 MÅL NÅDD: ${ticker}`,
        body: `${ticker} har nådd target på ${target.toFixed(2)} kr! Nåværende pris: ${price.toFixed(2)} kr`,
        tag: `target-hit-${ticker}`,
        requireInteraction: true,
      });
    },
    [sendNotification]
  );

  const notifyBuySignal = useCallback(
    (ticker: string, strategy: string, kScore: number) => {
      return sendNotification({
        title: `🟢 KJØPSSIGNAL: ${ticker}`,
        body: `${ticker} har fått BUY-signal på ${strategy} med K-Score ${kScore}`,
        tag: `buy-signal-${ticker}`,
      });
    },
    [sendNotification]
  );

  const notifyReminder = useCallback(
    (ticker: string, message: string) => {
      return sendNotification({
        title: `📝 Påminnelse: ${ticker}`,
        body: message,
        tag: `reminder-${ticker}`,
      });
    },
    [sendNotification]
  );

  return {
    isSupported,
    permission,
    isEnabled: permission === 'granted',
    requestPermission,
    sendNotification,
    // Pre-defined notifications
    notifyPriceAlert,
    notifyStopLoss,
    notifyTargetHit,
    notifyBuySignal,
    notifyReminder,
  };
}

// Storage key for notification settings
const NOTIFICATION_SETTINGS_KEY = 'k-man-notification-settings';

export interface NotificationSettings {
  enabled: boolean;
  priceAlerts: boolean;
  stopLossAlerts: boolean;
  targetAlerts: boolean;
  buySignals: boolean;
  reminders: boolean;
}

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      priceAlerts: true,
      stopLossAlerts: true,
      targetAlerts: true,
      buySignals: true,
      reminders: true,
    };
  }

  const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  return {
    enabled: false,
    priceAlerts: true,
    stopLossAlerts: true,
    targetAlerts: true,
    buySignals: true,
    reminders: true,
  };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  }
}
