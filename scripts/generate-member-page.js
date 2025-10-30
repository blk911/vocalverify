#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get page name from command line argument
const pageName = process.argv[2];

if (!pageName) {
  console.error('❌ Error: Page name is required');
  console.log('Usage: node scripts/generate-member-page.js <page-name>');
  process.exit(1);
}

// Convert page name to kebab-case
const kebabCase = pageName.toLowerCase().replace(/\s+/g, '-');
const pascalCase = pageName.replace(/\s+/g, '').replace(/^[a-z]/, c => c.toUpperCase());

// Create directory if it doesn't exist
const pageDir = path.join(__dirname, '..', 'src', 'app', kebabCase);
if (!fs.existsSync(pageDir)) {
  fs.mkdirSync(pageDir, { recursive: true });
}

// Template for the page
const pageTemplate = `'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MemberPageLayout from '@/components/layouts/MemberPageLayout';

export default function ${pascalCase}Page() {
  const [memberCode, setMemberCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('memberCode');
    if (code) {
      setMemberCode(code);
      setLoading(false);
    } else {
      setError('No member code provided');
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <MemberPageLayout pageTitle="${pageName}">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MemberPageLayout>
    );
  }

  if (error) {
    return (
      <MemberPageLayout pageTitle="${pageName}">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </MemberPageLayout>
    );
  }

  return (
    <MemberPageLayout 
      pageTitle="${pageName}"
      showBackButton={true}
      backButtonText="← Dashboard"
      backButtonHref={\`/member-dashboard?memberCode=\${memberCode}\`}
    >
      <div className="space-y-6">
        {/* Add your page content here */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">${pageName} Content</h2>
          <p className="text-gray-600">This is your ${pageName} page content.</p>
        </div>
      </div>
    </MemberPageLayout>
  );
}
`;

// Write the page file
const pagePath = path.join(pageDir, 'page.tsx');
fs.writeFileSync(pagePath, pageTemplate);

console.log('✅ Member page generated successfully!');
console.log(`📁 Location: ${pagePath}`);
console.log(`🌐 URL: /${kebabCase}`);
console.log('📝 Next steps:');
console.log('1. Add your page content to the template');
console.log('2. Add API calls as needed');
console.log('3. Test the page layout');
console.log('4. Add navigation links if needed');

