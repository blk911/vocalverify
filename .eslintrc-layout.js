module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Enforce MemberPageLayout usage for member pages
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/components/mem/Topbar', '@/components/mem/Sidebar'],
            message: 'Use MemberPageLayout instead of importing Topbar/Sidebar directly'
          }
        ]
      }
    ],
    // Enforce layout structure
    'react/jsx-no-useless-fragment': 'error',
    'react/jsx-key': 'error',
    // Prevent inline styles
    'react/no-inline-styles': 'error',
    // Enforce consistent naming
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function'
      }
    ]
  },
  overrides: [
    {
      files: ['src/app/**/page.tsx'],
      rules: {
        // Require MemberPageLayout for member pages
        'no-restricted-syntax': [
          'error',
          {
            selector: 'ImportDeclaration[source.value="@/components/mem/Topbar"]',
            message: 'Member pages must use MemberPageLayout component instead of direct Topbar import'
          },
          {
            selector: 'ImportDeclaration[source.value="@/components/mem/Sidebar"]',
            message: 'Member pages must use MemberPageLayout component instead of direct Sidebar import'
          }
        ]
      }
    }
  ]
};

