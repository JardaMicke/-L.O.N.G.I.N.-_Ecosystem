module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^uuid$': '<rootDir>/__mocks__/uuid.js',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
