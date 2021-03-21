module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Viljum frekar named exports
    'import/prefer-default-export': 0,

    // Verðum að hafa extensions út af es modules
    'import/extensions': 0,

    // Skilgreinum að þetta sé rótin í verkefninu okkar, þar sem það er annað
    // package.json skjal í ./src
    'import/no-extraneous-dependencies': ['error', { packageDir: './' }],

    // Leyfum console.info, warn og error
    'no-console': ['error', { allow: ['info', 'warn', 'error'] }],

    // Leyfum ákveðin orð án camelCase
    'no-camelcase': ['error', { allow: ['first_aired', 'in_production'] }],
  },
};
