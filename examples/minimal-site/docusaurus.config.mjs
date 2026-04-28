import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Version Diff Sign Dev Site',
  tagline:
    'Minimal Docusaurus site for visual verification during development.',
  url: 'http://localhost',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  favicon:
    'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%2300554a%22/><path d=%22M18 33h12l6-14h10L34 45H24l6-12H18z%22 fill=%22%23fff%22/></svg>',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.js',
          includeCurrentVersion: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  plugins: [
    [
      path.resolve(__dirname, '../../lib/index.js'),
      {
        sign: {
          heading: {
            color: '#00554a',
          },
          sidebar: {
            color: '#c17b11',
          },
          toc: {
            color: '#c17b11',
          },
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Version Diff Sign',
      items: [
        {
          to: '/docs/guide/start',
          label: 'Docs',
          position: 'left',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
  },
};

export default config;
