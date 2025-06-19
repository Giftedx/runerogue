import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { GameRoomProvider } from "@/providers/GameRoomProvider";

// Mock useDiscord to avoid auth dependency
jest.mock("@/providers/DiscordActivityProvider", () => ({
  useDiscord: () => ({ user: { username: "TestUser", id: "testid" } }),
}));

// Mock useGameRoom to provide test state
jest.mock("@/providers/GameRoomProvider", () => {
  const actual = jest.requireActual("@/providers/GameRoomProvider");
  return {
    ...actual,
    useGameRoom: () => ({
      state: {
        players: {
          player1: {
            id: "player1",
            x: 10,
            y: 20,
            health: 15,
            maxHealth: 20,
            attack: 5,
            strength: 6,
            defence: 7,
          },
        },
        enemies: {
          enemy1: {
            id: "enemy1",
            x: 30,
            y: 40,
            health: 12,
            maxHealth: 15,
            attack: 8,
            strength: 9,
            defence: 10,
          },
        },
      },
    }),
  };
});

describe("App enemy stats display", () => {
  it("renders enemy stats from state", () => {
    render(
      <GameRoomProvider>
        <App />
      </GameRoomProvider>,
    );
    expect(screen.getByText(/enemy1/i)).toBeInTheDocument();
    expect(screen.getByText(/12\/15 HP/i)).toBeInTheDocument();
    expect(screen.getByText(/ATK: 8 STR: 9 DEF: 10/i)).toBeInTheDocument();
  });
});
