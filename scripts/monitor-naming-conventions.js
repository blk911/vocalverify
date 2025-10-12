#!/usr/bin/env node

/**
 * Naming Convention Monitor
 * Validates codebase follows consistent naming conventions
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // File patterns to check
  patterns: {
    ts: '**/*.ts',
    tsx: '**/*.tsx',
    js: '**/*.js',
    jsx: '**/*.jsx'
  },
  
  // Directories to exclude
  exclude: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    'coverage/**'
  ],
  
  // Naming convention rules
  rules: {
    // Variables and functions: camelCase
    variables: /^[a-z][a-zA-Z0-9]*$/,
    functions: /^[a-z][a-zA-Z0-9]*$/,
    
    // Classes and interfaces: PascalCase
    classes: /^[A-Z][a-zA-Z0-9]*$/,
    interfaces: /^I[A-Z][a-zA-Z0-9]*$/,
    
    // Constants: UPPER_SNAKE_CASE
    constants: /^[A-Z][A-Z0-9_]*$/,
    
    // Files: kebab-case or camelCase
    files: /^[a-z][a-zA-Z0-9-]*$/,
    
    // Directories: kebab-case
    directories: /^[a-z][a-z0-9-]*$/
  },
  
  // Error thresholds
  thresholds: {
    maxErrors: 50,
    maxWarnings: 100
  }
};

// Statistics
let stats = {
  filesChecked: 0,
  errors: 0,
  warnings: 0,
  violations: []
};

/**
 * Get all files matching patterns
 */
function getFiles(dir, patterns) {
  const files = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip excluded directories
        const relativePath = path.relative(process.cwd(), fullPath);
        if (CONFIG.exclude.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
          return regex.test(relativePath);
        })) {
          continue;
        }
        
        walkDir(fullPath);
      } else if (stat.isFile()) {
        // Check if file matches patterns
        const ext = path.extname(item);
        if (patterns.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walkDir(dir);
  return files;
}

/**
 * Extract identifiers from TypeScript/JavaScript code
 */
function extractIdentifiers(content) {
  const identifiers = {
    variables: [],
    functions: [],
    classes: [],
    interfaces: [],
    constants: []
  };
  
  // Variable declarations
  const varRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  let match;
  while ((match = varRegex.exec(content)) !== null) {
    const name = match[1];
    if (name === name.toUpperCase() && name.includes('_')) {
      identifiers.constants.push(name);
    } else {
      identifiers.variables.push(name);
    }
  }
  
  // Function declarations
  const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  while ((match = funcRegex.exec(content)) !== null) {
    identifiers.functions.push(match[1]);
  }
  
  // Arrow functions
  const arrowRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
  while ((match = arrowRegex.exec(content)) !== null) {
    identifiers.functions.push(match[1]);
  }
  
  // Class declarations
  const classRegex = /class\s+([A-Z][a-zA-Z0-9]*)/g;
  while ((match = classRegex.exec(content)) !== null) {
    identifiers.classes.push(match[1]);
  }
  
  // Interface declarations
  const interfaceRegex = /interface\s+([A-Z][a-zA-Z0-9]*)/g;
  while ((match = interfaceRegex.exec(content)) !== null) {
    identifiers.interfaces.push(match[1]);
  }
  
  return identifiers;
}

/**
 * Check naming convention for identifier
 */
function checkNaming(identifier, type, rules) {
  const rule = rules[type];
  if (!rule) return { valid: true };
  
  const isValid = rule.test(identifier);
  return {
    valid: isValid,
    identifier,
    type,
    expected: getExpectedFormat(type)
  };
}

/**
 * Get expected format description
 */
function getExpectedFormat(type) {
  const formats = {
    variables: 'camelCase (e.g., myVariable)',
    functions: 'camelCase (e.g., myFunction)',
    classes: 'PascalCase (e.g., MyClass)',
    interfaces: 'PascalCase with I prefix (e.g., IMyInterface)',
    constants: 'UPPER_SNAKE_CASE (e.g., MY_CONSTANT)'
  };
  return formats[type] || 'Unknown format';
}

/**
 * Check file naming convention
 */
function checkFileNaming(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const dirName = path.basename(path.dirname(filePath));
  
  const violations = [];
  
  // Check file name
  if (!CONFIG.rules.files.test(fileName)) {
    violations.push({
      type: 'file',
      name: fileName,
      path: filePath,
      message: `File name should be kebab-case or camelCase: ${fileName}`,
      expected: 'kebab-case or camelCase (e.g., my-file.ts or myFile.ts)'
    });
  }
  
  // Check directory name
  if (!CONFIG.rules.directories.test(dirName)) {
    violations.push({
      type: 'directory',
      name: dirName,
      path: filePath,
      message: `Directory name should be kebab-case: ${dirName}`,
      expected: 'kebab-case (e.g., my-directory)'
    });
  }
  
  return violations;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const identifiers = extractIdentifiers(content);
    const fileViolations = checkFileNaming(filePath);
    
    const violations = [...fileViolations];
    
    // Check each identifier type
    Object.entries(identifiers).forEach(([type, names]) => {
      names.forEach(name => {
        const result = checkNaming(name, type, CONFIG.rules);
        if (!result.valid) {
          violations.push({
            type: 'identifier',
            name: name,
            path: filePath,
            line: findLineNumber(content, name),
            message: `${type} '${name}' does not follow naming convention`,
            expected: result.expected
          });
        }
      });
    });
    
    return violations;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Find line number for identifier
 */
function findLineNumber(content, identifier) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(identifier)) {
      return i + 1;
    }
  }
  return 0;
}

/**
 * Generate report
 */
function generateReport() {
  const totalViolations = stats.violations.length;
  const errors = stats.violations.filter(v => v.severity === 'error').length;
  const warnings = stats.violations.filter(v => v.severity === 'warning').length;
  
  console.log('\n=== Naming Convention Report ===');
  console.log(`Files checked: ${stats.filesChecked}`);
  console.log(`Total violations: ${totalViolations}`);
  console.log(`Errors: ${errors}`);
  console.log(`Warnings: ${warnings}`);
  
  if (totalViolations > 0) {
    console.log('\n=== Violations ===');
    
    // Group by file
    const byFile = {};
    stats.violations.forEach(violation => {
      if (!byFile[violation.path]) {
        byFile[violation.path] = [];
      }
      byFile[violation.path].push(violation);
    });
    
    Object.entries(byFile).forEach(([filePath, violations]) => {
      console.log(`\n${filePath}:`);
      violations.forEach(violation => {
        const lineInfo = violation.line ? `:${violation.line}` : '';
        console.log(`  ${violation.severity.toUpperCase()} ${lineInfo}: ${violation.message}`);
        console.log(`    Expected: ${violation.expected}`);
      });
    });
  }
  
  // Exit with appropriate code
  if (errors > CONFIG.thresholds.maxErrors) {
    console.log(`\n❌ Too many errors (${errors} > ${CONFIG.thresholds.maxErrors})`);
    process.exit(1);
  } else if (warnings > CONFIG.thresholds.maxWarnings) {
    console.log(`\n⚠️  Too many warnings (${warnings} > ${CONFIG.thresholds.maxWarnings})`);
    process.exit(1);
  } else {
    console.log('\n✅ Naming conventions check passed');
    process.exit(0);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Checking naming conventions...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const patterns = ['.ts', '.tsx', '.js', '.jsx'];
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found');
    process.exit(1);
  }
  
  const files = getFiles(srcDir, patterns);
  stats.filesChecked = files.length;
  
  console.log(`Found ${files.length} files to check`);
  
  files.forEach(filePath => {
    const violations = processFile(filePath);
    violations.forEach(violation => {
      violation.severity = violation.type === 'identifier' ? 'error' : 'warning';
      stats.violations.push(violation);
    });
  });
  
  generateReport();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  processFile,
  checkNaming,
  extractIdentifiers,
  CONFIG
};









