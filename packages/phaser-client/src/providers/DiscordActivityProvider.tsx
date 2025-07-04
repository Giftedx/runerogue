import React, { createContext, useContext, useState, useEffect } from "react";
import { DiscordActivity, DiscordUser } from "@/discord/DiscordActivity";

// Context for Discord user
const DiscordContext = createContext<{ user: DiscordUser | null }>({
  user: null,
});

/**
 * Provider that handles Discord OAuth and exposes the authenticated user.
 */
export const DiscordActivityProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<DiscordUser | null>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
    
    // Check if we're in a Discord environment by looking for frame_id query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isInDiscord = urlParams.has('frame_id');
    
    if (!clientId || !isInDiscord) {
      console.warn(
        !clientId ? 
          "VITE_DISCORD_CLIENT_ID is not defined - running in demo mode" :
          "Not running in Discord environment - running in demo mode"
      );
      // Set a mock user for development
      setUser({
        id: "demo-user",
        username: "DemoUser",
        discriminator: "0001",
        avatar: null,
      });
      return;
    }

    // Only try Discord SDK if we're actually in Discord
    try {
      const activity = new DiscordActivity(clientId);
      activity
        .login()
        .then(setUser)
        .catch((err) => {
          console.error("Discord login failed", err);
          // Set a mock user as fallback
          setUser({
            id: "demo-user",
            username: "DemoUser",
            discriminator: "0001",
            avatar: null,
          });
        });
    } catch (err) {
      console.error("Discord SDK initialization failed", err);
      // Set a mock user as fallback
      setUser({
        id: "demo-user",
        username: "DemoUser",
        discriminator: "0001",
        avatar: null,
      });
    }
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        Loading Discord...
      </div>
    );
  }

  return (
    <DiscordContext.Provider value={{ user }}>
      {children}
    </DiscordContext.Provider>
  );
};

/**
 * Hook to access the authenticated Discord user.
 */
export const useDiscord = (): { user: DiscordUser } => {
  const context = useContext(DiscordContext);
  if (!context.user) {
    throw new Error("useDiscord must be used within a DiscordActivityProvider");
  }
  return context;
};
