"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Notification {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (cancelledRef.current || !res.ok) return;
      const data = await res.json();
      setNotifications(data.data || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelledRef.current = true; clearInterval(interval); };
  }, [load]);

  return { notifications, unreadCount, markAsRead, refresh: load };
}
