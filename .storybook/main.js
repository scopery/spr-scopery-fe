const path = require('path')

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: ['../shared/ui/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  staticDirs: ['../public'],
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  webpackFinal: async (config) => {
    // Add path alias
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../'),
      }
      config.resolve.extensions.push('.ts', '.tsx')
    }

    // Find and update the rule for .tsx files
    const rules = config.module.rules
    const fileLoaderRule = rules.find((rule) => rule.test && rule.test.test('.tsx'))
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /node_modules/
    }

    // Add explicit TypeScript handling
    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            presets: [
              [require.resolve('@babel/preset-env'), { targets: 'defaults' }],
              [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
              [
                require.resolve('@babel/preset-typescript'),
                {
                  isTSX: true,
                  allExtensions: true,
                  onlyRemoveTypeImports: true,
                },
              ],
            ],
          },
        },
      ],
    })

    // Find and modify existing CSS rule to add PostCSS
    const cssRule = config.module.rules.find(
      (rule) => rule.test && rule.test.toString().includes('css')
    )

    if (cssRule && Array.isArray(cssRule.use)) {
      // Add postcss-loader to existing CSS rule
      cssRule.use.push({
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            plugins: [require('tailwindcss'), require('autoprefixer')],
          },
        },
      })
    }

    return config
  },
}

module.exports = config
