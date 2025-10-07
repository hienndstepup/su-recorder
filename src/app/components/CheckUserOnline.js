"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";

// Tạo context để chia sẻ số lượng user online
const UserOnlineContext = createContext();

export const useUserOnline = () => {
  const context = useContext(UserOnlineContext);
  if (!context) {
    throw new Error("useUserOnline must be used within UserOnlineProvider");
  }
  return context;
};

const CheckUserOnline = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    let heartbeatIntervalId;
    let currentChannel = null;

    const initializePresence = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setCurrentUserId(user.id);
          
          // Tạo channel để theo dõi presence
          currentChannel = supabase.channel('online-users', {
            config: {
              presence: {
                key: user.id,
              },
            },
          });

          // Lắng nghe thay đổi presence
          currentChannel.on('presence', { event: 'sync' }, () => {
            const state = currentChannel.presenceState();
            const onlineUserIds = new Set();
            
            console.log('Presence state:', state);
            
            // Lấy tất cả user IDs đang online
            Object.values(state).forEach((presences) => {
              presences.forEach((presence) => {
                if (presence.user_id) {
                  onlineUserIds.add(presence.user_id);
                }
              });
            });
            
            console.log('Online users:', onlineUserIds.size, Array.from(onlineUserIds));
            setOnlineUsers(onlineUserIds);
            setIsLoading(false);
          });

          // Subscribe to channel TRƯỚC khi track
          await currentChannel.subscribe();

          // Đợi một chút để đảm bảo channel đã join thành công
          setTimeout(async () => {
            try {
              // Track presence của user hiện tại SAU KHI đã subscribe
              await currentChannel.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
              });
              console.log('Initial presence tracked for user:', user.id);
            } catch (error) {
              console.error('Error tracking initial presence:', error);
            }
          }, 1000);
          
          setChannel(currentChannel);
          console.log('Channel initialized and subscribed');
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing presence:", error);
        setIsLoading(false);
      }
    };

    // Khởi tạo presence
    initializePresence();

    // Heartbeat để duy trì presence
    heartbeatIntervalId = setInterval(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && currentChannel && currentChannel.state === 'joined') {
          await currentChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          console.log('Heartbeat sent for user:', user.id);
        }
      } catch (error) {
        console.error("Error in heartbeat:", error);
      }
    }, 30000); // Mỗi 30 giây

    // Cleanup khi component unmount
    return () => {
      if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
      
      // Untrack presence khi rời khỏi trang
      if (currentChannel) {
        currentChannel.untrack();
        supabase.removeChannel(currentChannel);
        console.log('Channel cleaned up');
      }
    };
  }, []); // Empty dependency array để chỉ chạy một lần

  // Lắng nghe sự kiện beforeunload để untrack presence
  useEffect(() => {
    const handleBeforeUnload = async () => {
      try {
        if (channel) {
          await channel.untrack();
          console.log('Presence untracked on unload');
        }
      } catch (error) {
        console.error("Error untracking presence on unload:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [channel]);

  const value = {
    onlineUsers: onlineUsers.size,
    isLoading
  };

  return (
    <UserOnlineContext.Provider value={value}>
      {children}
    </UserOnlineContext.Provider>
  );
};

export default CheckUserOnline;