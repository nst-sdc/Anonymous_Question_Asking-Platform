module.exports = (api) => {
  // Cache configuration is a required option
  const isTest = api.env('test');
  api.cache(true);

  const presets = [
    ['@babel/preset-env', { 
      targets: isTest ? { node: 'current' } : '> 0.25%, not dead',
      modules: isTest ? 'commonjs' : false,
      useBuiltIns: 'usage',
      corejs: 3,
    }],
    ['@babel/preset-react', { 
      runtime: 'automatic',
      development: process.env.NODE_ENV !== 'production',
    }],
  ];

  const plugins = [
    // Modern JavaScript features
    '@babel/plugin-transform-runtime',
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator',
    
    // Class properties and private methods
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    
    // Module-related plugins
    '@babel/plugin-syntax-dynamic-import',
    isTest && 'babel-plugin-dynamic-import-node',
  ].filter(Boolean);

  return {
    presets,
    plugins,
  };
};
