module.exports = {
    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // The test environment that will be used for testing
    testEnvironment: 'node',

    // Source files roots (limit to `src/`)
    roots: ['<rootDir>/src'],

    // Transform ts(x) files using `ts-jest`
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },

    // Looks for tests in the __tests__ folder or alongside ts(x) files with the .(test|spec).ts(x)
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',

    // Add ts(x) file extensions so jest sees them
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
