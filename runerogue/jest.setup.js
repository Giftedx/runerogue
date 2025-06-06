const { defaults } = require('jest-config');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: [
        '<rootDir>/server-ts/src',
        '<rootDir>/archives/runescape-rogue-prime/meta-ui',
        '<rootDir>/archives/runescape-rogue-prime/backend/telemetry-aggregator',
        '<rootDir>/archives/runescape-rogue-prime/backend/api-gateway',
        '<rootDir>/archives/runescape-rogue-prime/backend/game-server',
        '<rootDir>/archives/runescape-rogue-prime/backend/auth-service',
        '<rootDir>/archives/services/auth',
        '<rootDir>/archives/runescape-discord-game/server',
        '<rootDir>/archives/runescape-discord-game/client',
        '<rootDir>/tools-python/.venv/Lib/site-packages/playwright/driver/package',
        '<rootDir>/server-ts/client/meta-ui'
    ],
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    }
};