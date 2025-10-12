#!/usr/bin/env node

/**
 * Naming Convention Audit
 * Comprehensive audit of naming conventions across the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Directories to audit
  directories: [
    'src',
    'scripts',
    'public'
  ],
  
  // File extensions to check
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  
  // Exclude patterns
  exclude: [
    'node_modules',
    '.next',
    'dist',
    'build',
    'coverage',
    '.git'
  ],
  
  // Naming rules
  rules: {
    // File naming
    files: {
      components: /^[A-Z][a-zA-Z0-9]*\.(tsx|jsx)$/, // PascalCase for components
      pages: /^[a-z][a-zA-Z0-9-]*\.(tsx|jsx)$/, // kebab-case for pages
      utils: /^[a-z][a-zA-Z0-9]*\.(ts|js)$/, // camelCase for utilities
      config: /^[a-z][a-zA-Z0-9-]*\.(json|js|ts)$/ // kebab-case for config
    },
    
    // Directory naming
    directories: {
      components: /^[A-Z][a-zA-Z0-9]*$/, // PascalCase for component directories
      pages: /^[a-z][a-zA-Z0-9-]*$/, // kebab-case for page directories
      utils: /^[a-z][a-zA-Z0-9]*$/, // camelCase for utility directories
      api: /^[a-z][a-zA-Z0-9-]*$/ // kebab-case for API routes
    }
  },
  
  // Report thresholds
  thresholds: {
    critical: 10,
    warning: 50,
    info: 100
  }
};

// Audit results
let auditResults = {
  totalFiles: 0,
  totalDirectories: 0,
  violations: [],
  summary: {
    critical: 0,
    warning: 0,
    info: 0,
    passed: 0
  },
  categories: {
    files: [],
    directories: [],
    imports: [],
    exports: []
  }
};

/**
 * Check if path should be excluded
 */
function shouldExclude(filePath) {
  return CONFIG.exclude.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filePath);
  });
}

/**
 * Get file category based on path
 */
function getFileCategory(filePath) {
  if (filePath.includes('/components/') || filePath.includes('\\components\\')) {
    return 'components';
  } else if (filePath.includes('/pages/') || filePath.includes('\\pages\\')) {
    return 'pages';
  } else if (filePath.includes('/api/') || filePath.includes('\\api\\')) {
    return 'api';
  } else if (filePath.includes('/utils/') || filePath.includes('\\utils\\')) {
    return 'utils';
  } else if (filePath.includes('/config/') || filePath.includes('\\config\\')) {
    return 'config';
  }
  return 'other';
}

/**
 * Check file naming convention
 */
function checkFileNaming(filePath, category) {
  const fileName = path.basename(filePath);
  const nameWithoutExt = path.basename(filePath, path.extname(filePath));
  const rule = CONFIG.rules.files[category];
  
  if (!rule) return null;
  
  const isValid = rule.test(fileName);
  if (!isValid) {
    return {
      type: 'file',
      path: filePath,
      name: fileName,
      category,
      severity: 'warning',
      message: `File '${fileName}' does not follow ${category} naming convention`,
      expected: getExpectedFileFormat(category)
    };
  }
  
  return null;
}

/**
 * Check directory naming convention
 */
function checkDirectoryNaming(dirPath, category) {
  const dirName = path.basename(dirPath);
  const rule = CONFIG.rules.directories[category];
  
  if (!rule) return null;
  
  const isValid = rule.test(dirName);
  if (!isValid) {
    return {
      type: 'directory',
      path: dirPath,
      name: dirName,
      category,
      severity: 'warning',
      message: `Directory '${dirName}' does not follow ${category} naming convention`,
      expected: getExpectedDirFormat(category)
    };
  }
  
  return null;
}

/**
 * Get expected file format
 */
function getExpectedFileFormat(category) {
  const formats = {
    components: 'PascalCase (e.g., MyComponent.tsx)',
    pages: 'kebab-case (e.g., my-page.tsx)',
    utils: 'camelCase (e.g., myUtils.ts)',
    config: 'kebab-case (e.g., my-config.json)',
    api: 'kebab-case (e.g., my-route.ts)'
  };
  return formats[category] || 'Unknown format';
}

/**
 * Get expected directory format
 */
function getExpectedDirFormat(category) {
  const formats = {
    components: 'PascalCase (e.g., MyComponent)',
    pages: 'kebab-case (e.g., my-page)',
    utils: 'camelCase (e.g., myUtils)',
    api: 'kebab-case (e.g., my-route)'
  };
  return formats[category] || 'Unknown format';
}

/**
 * Scan directory recursively
 */
function scanDirectory(dirPath, category) {
  if (shouldExclude(dirPath)) return;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        auditResults.totalDirectories++;
        
        // Check directory naming
        const dirViolation = checkDirectoryNaming(fullPath, category);
        if (dirViolation) {
          auditResults.violations.push(dirViolation);
          auditResults.categories.directories.push(dirViolation);
        }
        
        // Recursively scan subdirectory
        scanDirectory(fullPath, category);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (CONFIG.extensions.includes(ext)) {
          auditResults.totalFiles++;
          
          // Check file naming
          const fileViolation = checkFileNaming(fullPath, category);
          if (fileViolation) {
            auditResults.violations.push(fileViolation);
            auditResults.categories.files.push(fileViolation);
          }
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
}

/**
 * Analyze import/export patterns
 */
function analyzeImportsExports() {
  console.log('📊 Analyzing import/export patterns...');
  
  try {
    // Find all TypeScript/JavaScript files
    const files = [];
    CONFIG.directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        scanForFiles(dir, files);
      }
    });
    
    // Analyze each file
    files.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        analyzeFileImportsExports(filePath, content);
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
      }
    });
  } catch (error) {
    console.error('Error analyzing imports/exports:', error.message);
  }
}

/**
 * Recursively find files
 */
function scanForFiles(dirPath, files) {
  if (shouldExclude(dirPath)) return;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanForFiles(fullPath, files);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          files.push(fullPath);
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error.message);
  }
}

/**
 * Analyze imports and exports in a file
 */
function analyzeFileImportsExports(filePath, content) {
  // Check for relative imports that could be absolute
  const relativeImportRegex = /import.*from\s+['"](\.\.?\/.*)['"]/g;
  let match;
  while ((match = relativeImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('../../')) {
      auditResults.categories.imports.push({
        type: 'deep-relative-import',
        path: filePath,
        importPath,
        severity: 'info',
        message: `Deep relative import: ${importPath}`,
        suggestion: 'Consider using absolute imports with path mapping'
      });
    }
  }
  
  // Check for unused exports
  const exportRegex = /export\s+(?:const|function|class|interface|type)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    const exportName = match[1];
    // This is a simplified check - in reality, you'd need to analyze the entire codebase
    auditResults.categories.exports.push({
      type: 'export',
      path: filePath,
      name: exportName,
      severity: 'info',
      message: `Exported: ${exportName}`
    });
  }
}

/**
 * Generate comprehensive report
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 NAMING CONVENTION AUDIT REPORT');
  console.log('='.repeat(60));
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`Total files scanned: ${auditResults.totalFiles}`);
  console.log(`Total directories scanned: ${auditResults.totalDirectories}`);
  console.log(`Total violations: ${auditResults.violations.length}`);
  
  // Categorize violations
  auditResults.violations.forEach(violation => {
    auditResults.summary[violation.severity]++;
  });
  
  console.log(`\nSeverity breakdown:`);
  console.log(`  Critical: ${auditResults.summary.critical}`);
  console.log(`  Warning: ${auditResults.summary.warning}`);
  console.log(`  Info: ${auditResults.summary.info}`);
  console.log(`  Passed: ${auditResults.totalFiles - auditResults.violations.length}`);
  
  // File violations
  if (auditResults.categories.files.length > 0) {
    console.log('\n📁 FILE NAMING VIOLATIONS:');
    auditResults.categories.files.forEach(violation => {
      console.log(`  ${violation.severity.toUpperCase()}: ${violation.path}`);
      console.log(`    ${violation.message}`);
      console.log(`    Expected: ${violation.expected}`);
    });
  }
  
  // Directory violations
  if (auditResults.categories.directories.length > 0) {
    console.log('\n📂 DIRECTORY NAMING VIOLATIONS:');
    auditResults.categories.directories.forEach(violation => {
      console.log(`  ${violation.severity.toUpperCase()}: ${violation.path}`);
      console.log(`    ${violation.message}`);
      console.log(`    Expected: ${violation.expected}`);
    });
  }
  
  // Import/Export analysis
  if (auditResults.categories.imports.length > 0) {
    console.log('\n🔗 IMPORT ANALYSIS:');
    auditResults.categories.imports.forEach(item => {
      console.log(`  ${item.severity.toUpperCase()}: ${item.path}`);
      console.log(`    ${item.message}`);
      if (item.suggestion) {
        console.log(`    Suggestion: ${item.suggestion}`);
      }
    });
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (auditResults.summary.critical > 0) {
    console.log('  ❌ Fix critical naming violations immediately');
  }
  if (auditResults.summary.warning > 0) {
    console.log('  ⚠️  Address warning-level violations');
  }
  if (auditResults.categories.imports.length > 0) {
    console.log('  🔗 Consider using absolute imports for better maintainability');
  }
  console.log('  📚 Review and update naming conventions documentation');
  console.log('  🔄 Run this audit regularly to maintain consistency');
  
  // Exit code
  if (auditResults.summary.critical > CONFIG.thresholds.critical) {
    console.log('\n❌ Audit failed: Too many critical violations');
    process.exit(1);
  } else if (auditResults.summary.warning > CONFIG.thresholds.warning) {
    console.log('\n⚠️  Audit warning: High number of violations');
    process.exit(1);
  } else {
    console.log('\n✅ Audit passed: Naming conventions are acceptable');
    process.exit(0);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Starting comprehensive naming convention audit...');
  
  // Scan each configured directory
  CONFIG.directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`📁 Scanning ${dir}...`);
      scanDirectory(dir, getFileCategory(dir));
    } else {
      console.log(`⚠️  Directory ${dir} not found, skipping...`);
    }
  });
  
  // Analyze imports and exports
  analyzeImportsExports();
  
  // Generate report
  generateReport();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  scanDirectory,
  checkFileNaming,
  checkDirectoryNaming,
  analyzeImportsExports,
  CONFIG
};









