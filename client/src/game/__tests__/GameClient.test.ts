import { GameClient } from "../GameClient";

describe("GameClient", () => {
  let gameClient: GameClient;
  let mockGameEngine: any;

  beforeEach(() => {
    mockGameEngine = {
      updateFromServerState: jest.fn(),
      createPlayerEntity: jest.fn(),
      removePlayerEntity: jest.fn(),
    };
    gameClient = new GameClient();
  });

  it("should throw error if connection fails", async () => {
    // Simulate connection failure by mocking Client
    jest.spyOn(require("colyseus.js"), "Client").mockImplementation(() => {
      return { joinOrCreate: () => Promise.reject(new Error("fail")) };
    });
    await expect(gameClient.connect(mockGameEngine)).rejects.toThrow(
      "Connection failed"
    );
  });

  it("should set up event handlers after successful connection", async () => {
    const mockRoom = {
      onStateChange: jest.fn(),
      state: { players: { onAdd: jest.fn(), onRemove: jest.fn() } },
    };
    jest.spyOn(require("colyseus.js"), "Client").mockImplementation(() => {
      return { joinOrCreate: () => Promise.resolve(mockRoom) };
    });
    await gameClient.connect(mockGameEngine);
    expect(mockRoom.onStateChange).toBeCalled();
  });
});
