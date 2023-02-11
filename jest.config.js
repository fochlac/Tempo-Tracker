module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testRegex: '__tests__/.*\\.test\\.ts$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
      '^src/(.*)': '<rootDir>/src/$1'
  },
  "transformIgnorePatterns": []
}
