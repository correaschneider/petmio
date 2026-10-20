import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const config = [
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          // Imports de barril do MUI pesam no dev server; use o caminho do componente.
          patterns: [
            { group: ['@mui/*/*/*'], message: 'Importe do primeiro nível do pacote MUI.' },
          ],
        },
      ],
    },
  },
  { ignores: ['.next/**', 'coverage/**', 'node_modules/**', 'next-env.d.ts'] },
];

export default config;
