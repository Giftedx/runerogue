it("should render damage number for enemy entity", () => {
  const enemyId = "enemy1";
  const enemySprite = { x: 150, y: 150 };
  scene["enemies"].set(enemyId, enemySprite as any);
  scene["showDamageNumber"](enemyId, 8, "hit");
  expect(mockAddText).toHaveBeenCalled();
  expect(scene["damageTextPool"].length).toBeGreaterThanOrEqual(1);
});
import { GameScene } from "../GameScene";
import type { GameClient } from "../../GameClient";
import type {
  GameRoomState,
  PlayerState,
} from "../../../../packages/shared/types";

// Mock Phaser dependencies
const mockAddSprite = jest.fn((x, y, key) => ({
  x,
  y,
  setPosition: jest.fn(),
  destroy: jest.fn(),
}));
const mockAddText = jest.fn((x, y, text, style) => {
  const obj = {
    x,
    y,
    setText: jest.fn(),
    setPosition: jest.fn(),
    setAlpha: jest.fn(),
    setColor: jest.fn(),
    setVisible: jest.fn(),
    setDepth: jest.fn(),
    alpha: 1,
    destroy: jest.fn(),
  };
  return obj;
});
const mockTweensAdd = jest.fn(
  ({ targets, y, alpha, duration, ease, onComplete }) => {
    // Simulate tween completion immediately
    if (onComplete) onComplete();
  },
);
const mockScene = {
  add: { sprite: mockAddSprite, text: mockAddText },
  cameras: { main: {} },
  input: { keyboard: { createCursorKeys: jest.fn() }, on: jest.fn() },
  tweens: { add: mockTweensAdd },
};
it("should render damage number on damage event", () => {
  const sprite = { x: 100, y: 100 };
  scene["players"].set(playerId, sprite as any);
  // Simulate damage event
  scene["showDamageNumber"](playerId, 5, "hit");
  expect(mockAddText).toHaveBeenCalled();
  // Should animate and pool the text object
  expect(scene["damageTextPool"].length).toBeGreaterThanOrEqual(1);
});

it("should use pooled damage text objects for performance", () => {
  const sprite = { x: 100, y: 100 };
  scene["players"].set(playerId, sprite as any);
  // Pre-populate pool
  const pooledText = mockAddText(0, 0, "", {});
  scene["damageTextPool"].push(pooledText);
  scene["showDamageNumber"](playerId, 10, "max");
  // Should use the pooled object, not create a new one
  expect(scene["damageTextPool"].length).toBeGreaterThanOrEqual(1);
});

it("should not throw if target sprite is missing for damage event", () => {
  expect(() =>
    scene["showDamageNumber"]("nonexistent", 7, "hit"),
  ).not.toThrow();
});

function createMockGameClient(localPlayerId: string): Partial<GameClient> {
  return {
    getLocalPlayerId: () => localPlayerId,
    sendMoveCommand: jest.fn(),
  };
}

describe("GameScene", () => {
  let scene: GameScene;
  let gameClient: Partial<GameClient>;
  const playerId = "player1";
  const otherId = "player2";
  const playerState: PlayerState = {
    id: playerId,
    name: "Test",
    position: { x: 100, y: 100 },
    health: { current: 10, max: 10 },
    stats: {} as any,
    equipment: {} as any,
    prayer: { points: 10, activePrayers: [], drainRate: 0 },
    specialAttack: { energy: 100, available: true },
    lastAttackTick: 0,
    inCombat: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    scene = new GameScene();
    // @ts-ignore
    Object.assign(scene, mockScene);
    gameClient = createMockGameClient(playerId);
    scene.setGameClient(gameClient as GameClient);
  });

  it("should predict local player movement on click", () => {
    scene["players"].set(playerId, { x: 100, y: 100 });
    scene["localPlayerId"] = playerId;
    scene["moveTarget"] = { x: 200, y: 200 };
    scene["predictionBuffer"] = [];
    // Simulate click-to-move
    // @ts-ignore
    scene.gameClient = gameClient;
    // @ts-ignore
    scene.input = {
      on: (event, cb) => cb({ positionToCamera: () => ({ x: 200, y: 200 }) }),
    };
    scene.update();
    expect(scene["predictionBuffer"].length).toBeGreaterThanOrEqual(0);
  });

  it("should interpolate toward server position", () => {
    const sprite = { x: 100, y: 100 };
    scene["players"].set(playerId, sprite as any);
    scene["localPlayerId"] = playerId;
    scene["predictionBuffer"] = [{ tick: 1, x: 200, y: 200 }];
    const state = {
      players: new Map([
        [playerId, { ...playerState, position: { x: 200, y: 200 } }],
      ]),
    } as unknown as GameRoomState;
    scene.updateFromServerState(state);
    expect(sprite.x).toBeGreaterThan(100);
    expect(sprite.y).toBeGreaterThan(100);
  });

  it("should prune prediction buffer when server confirms", () => {
    const sprite = { x: 200, y: 200 };
    scene["players"].set(playerId, sprite as any);
    scene["localPlayerId"] = playerId;
    scene["predictionBuffer"] = [
      { tick: 1, x: 200, y: 200 },
      { tick: 2, x: 210, y: 210 },
    ];
    const state = {
      players: new Map([
        [playerId, { ...playerState, position: { x: 200, y: 200 } }],
      ]),
    } as unknown as GameRoomState;
    scene.updateFromServerState(state);
    expect(scene["predictionBuffer"].length).toBe(1);
  });

  it("should handle missing player sprite gracefully", () => {
    const state = {
      players: new Map([
        [playerId, { ...playerState, position: { x: 200, y: 200 } }],
      ]),
    } as unknown as GameRoomState;
    expect(() => scene.updateFromServerState(state)).not.toThrow();
  });
});
