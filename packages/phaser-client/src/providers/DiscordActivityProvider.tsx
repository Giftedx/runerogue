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
    if (!clientId) {
      console.error("VITE_DISCORD_CLIENT_ID is not defined");
      return;
    }
    const activity = new DiscordActivity(clientId);
    activity
      .login()
      .then(setUser)
      .catch((err) => console.error("Discord login failed", err));
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
