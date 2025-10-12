#!/usr/bin/env node

/**
 * Naming Convention Dashboard
 * Interactive dashboard for monitoring naming conventions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Dashboard configuration
const DASHBOARD_CONFIG = {
  // Refresh interval in milliseconds
  refreshInterval: 5000,
  
  // File patterns to monitor
  patterns: {
    ts: '**/*.ts',
    tsx: '**/*.tsx',
    js: '**/*.js',
    jsx: '**/*.jsx'
  },
  
  // Directories to monitor
  directories: ['src', 'scripts'],
  
  // Exclude patterns
  exclude: [
    'node_modules',
    '.next',
    'dist',
    'build',
    'coverage'
  ],
  
  // Naming rules
  rules: {
    variables: /^[a-z][a-zA-Z0-9]*$/,
    functions: /^[a-z][a-zA-Z0-9]*$/,
    classes: /^[A-Z][a-zA-Z0-9]*$/,
    interfaces: /^I[A-Z][a-zA-Z0-9]*$/,
    constants: /^[A-Z][A-Z0-9_]*$/,
    files: /^[a-z][a-zA-Z0-9-]*$/,
    directories: /^[a-z][a-z0-9-]*$/
  }
};

// Dashboard state
let dashboardState = {
  startTime: Date.now(),
  lastUpdate: Date.now(),
  filesMonitored: 0,
  violations: [],
  stats: {
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0
  },
  trends: {
    violationsOverTime: [],
    fileChanges: [],
    categoryBreakdown: {}
  }
};

/**
 * Clear console and display header
 */
function displayHeader() {
  console.clear();
  console.log('='.repeat(80));
  console.log('🎯 NAMING CONVENTION DASHBOARD');
  console.log('='.repeat(80));
  console.log(`Started: ${new Date(dashboardState.startTime).toLocaleString()}`);
  console.log(`Last Update: ${new Date(dashboardState.lastUpdate).toLocaleString()}`);
  console.log(`Uptime: ${Math.floor((Date.now() - dashboardState.startTime) / 1000)}s`);
  console.log('='.repeat(80));
}

/**
 * Get file statistics
 */
function getFileStats() {
  let totalFiles = 0;
  let totalSize = 0;
  
  DASHBOARD_CONFIG.directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = getFilesRecursive(dir);
      totalFiles += files.length;
      files.forEach(file => {
        try {
          const stats = fs.statSync(file);
          totalSize += stats.size;
        } catch (error) {
          // Ignore errors
        }
      });
    }
  });
  
  return { totalFiles, totalSize };
}

/**
 * Get files recursively
 */
function getFilesRecursive(dir) {
  const files = [];
  
  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!DASHBOARD_CONFIG.exclude.includes(item)) {
            scan(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            files.push(fullPath);
          }
        }
      });
    } catch (error) {
      // Ignore errors
    }
  }
  
  scan(dir);
  return files;
}

/**
 * Check naming conventions
 */
function checkNamingConventions() {
  const violations = [];
  const files = [];
  
  DASHBOARD_CONFIG.directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      files.push(...getFilesRecursive(dir));
    }
  });
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileViolations = analyzeFile(filePath, content);
      violations.push(...fileViolations);
    } catch (error) {
      // Ignore errors
    }
  });
  
  return violations;
}

/**
 * Analyze a single file
 */
function analyzeFile(filePath, content) {
  const violations = [];
  
  // Check file naming
  const fileName = path.basename(filePath, path.extname(filePath));
  if (!DASHBOARD_CONFIG.rules.files.test(fileName)) {
    violations.push({
      type: 'file',
      path: filePath,
      severity: 'warning',
      message: `File name '${fileName}' does not follow convention`
    });
  }
  
  // Check directory naming
  const dirName = path.basename(path.dirname(filePath));
  if (!DASHBOARD_CONFIG.rules.directories.test(dirName)) {
    violations.push({
      type: 'directory',
      path: filePath,
      severity: 'info',
      message: `Directory name '${dirName}' does not follow convention`
    });
  }
  
  // Check variable naming
  const varRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  let match;
  while ((match = varRegex.exec(content)) !== null) {
    const varName = match[1];
    if (varName === varName.toUpperCase() && varName.includes('_')) {
      // Likely a constant
      if (!DASHBOARD_CONFIG.rules.constants.test(varName)) {
        violations.push({
          type: 'constant',
          path: filePath,
          severity: 'error',
          message: `Constant '${varName}' does not follow UPPER_SNAKE_CASE`
        });
      }
    } else {
      // Regular variable
      if (!DASHBOARD_CONFIG.rules.variables.test(varName)) {
        violations.push({
          type: 'variable',
          path: filePath,
          severity: 'error',
          message: `Variable '${varName}' does not follow camelCase`
        });
      }
    }
  }
  
  // Check function naming
  const funcRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  while ((match = funcRegex.exec(content)) !== null) {
    const funcName = match[1];
    if (!DASHBOARD_CONFIG.rules.functions.test(funcName)) {
      violations.push({
        type: 'function',
        path: filePath,
        severity: 'error',
        message: `Function '${funcName}' does not follow camelCase`
      });
    }
  }
  
  // Check class naming
  const classRegex = /class\s+([A-Z][a-zA-Z0-9]*)/g;
  while ((match = classRegex.exec(content)) !== null) {
    const className = match[1];
    if (!DASHBOARD_CONFIG.rules.classes.test(className)) {
      violations.push({
        type: 'class',
        path: filePath,
        severity: 'error',
        message: `Class '${className}' does not follow PascalCase`
      });
    }
  }
  
  return violations;
}

/**
 * Update dashboard statistics
 */
function updateStats() {
  const violations = checkNamingConventions();
  const fileStats = getFileStats();
  
  dashboardState.filesMonitored = fileStats.totalFiles;
  dashboardState.violations = violations;
  
  // Update stats
  dashboardState.stats.total = violations.length;
  dashboardState.stats.errors = violations.filter(v => v.severity === 'error').length;
  dashboardState.stats.warnings = violations.filter(v => v.severity === 'warning').length;
  dashboardState.stats.info = violations.filter(v => v.severity === 'info').length;
  
  // Update trends
  dashboardState.trends.violationsOverTime.push({
    timestamp: Date.now(),
    count: violations.length
  });
  
  // Keep only last 20 data points
  if (dashboardState.trends.violationsOverTime.length > 20) {
    dashboardState.trends.violationsOverTime.shift();
  }
  
  // Update category breakdown
  dashboardState.trends.categoryBreakdown = {};
  violations.forEach(violation => {
    const category = violation.type;
    dashboardState.trends.categoryBreakdown[category] = 
      (dashboardState.trends.categoryBreakdown[category] || 0) + 1;
  });
  
  dashboardState.lastUpdate = Date.now();
}

/**
 * Display statistics
 */
function displayStats() {
  console.log('\n📊 STATISTICS:');
  console.log(`Files monitored: ${dashboardState.filesMonitored}`);
  console.log(`Total violations: ${dashboardState.stats.total}`);
  console.log(`  Errors: ${dashboardState.stats.errors}`);
  console.log(`  Warnings: ${dashboardState.stats.warnings}`);
  console.log(`  Info: ${dashboardState.stats.info}`);
  
  // Health status
  let healthStatus = '🟢 HEALTHY';
  if (dashboardState.stats.errors > 10) {
    healthStatus = '🔴 CRITICAL';
  } else if (dashboardState.stats.errors > 5) {
    healthStatus = '🟡 WARNING';
  } else if (dashboardState.stats.warnings > 20) {
    healthStatus = '🟡 WARNING';
  }
  
  console.log(`\nHealth Status: ${healthStatus}`);
}

/**
 * Display category breakdown
 */
function displayCategoryBreakdown() {
  console.log('\n📋 VIOLATION BREAKDOWN:');
  Object.entries(dashboardState.trends.categoryBreakdown).forEach(([category, count]) => {
    const percentage = ((count / dashboardState.stats.total) * 100).toFixed(1);
    console.log(`  ${category}: ${count} (${percentage}%)`);
  });
}

/**
 * Display recent violations
 */
function displayRecentViolations() {
  const recentViolations = dashboardState.violations.slice(0, 10);
  
  if (recentViolations.length > 0) {
    console.log('\n🚨 RECENT VIOLATIONS:');
    recentViolations.forEach((violation, index) => {
      const severity = violation.severity.toUpperCase();
      const icon = severity === 'ERROR' ? '❌' : severity === 'WARNING' ? '⚠️' : 'ℹ️';
      console.log(`  ${index + 1}. ${icon} ${severation.type}: ${violation.message}`);
      console.log(`     Path: ${violation.path}`);
    });
  } else {
    console.log('\n✅ No violations found!');
  }
}

/**
 * Display trends
 */
function displayTrends() {
  if (dashboardState.trends.violationsOverTime.length > 1) {
    console.log('\n📈 TRENDS:');
    const recent = dashboardState.trends.violationsOverTime.slice(-5);
    const trend = recent.length > 1 ? 
      (recent[recent.length - 1].count - recent[0].count) : 0;
    
    const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
    console.log(`  Violation trend: ${trendIcon} ${trend > 0 ? '+' : ''}${trend}`);
  }
}

/**
 * Display recommendations
 */
function displayRecommendations() {
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (dashboardState.stats.errors > 10) {
    console.log('  🔴 High error count - review naming conventions immediately');
  }
  
  if (dashboardState.stats.warnings > 20) {
    console.log('  🟡 High warning count - consider updating file/directory names');
  }
  
  if (dashboardState.stats.total === 0) {
    console.log('  ✅ Excellent! No naming convention violations found');
  }
  
  console.log('  📚 Run `npm run naming:audit` for detailed analysis');
  console.log('  🔄 Keep this dashboard running for continuous monitoring');
}

/**
 * Main dashboard loop
 */
function runDashboard() {
  displayHeader();
  updateStats();
  displayStats();
  displayCategoryBreakdown();
  displayRecentViolations();
  displayTrends();
  displayRecommendations();
  
  console.log('\n' + '='.repeat(80));
  console.log('Press Ctrl+C to exit');
  console.log('='.repeat(80));
}

/**
 * Start dashboard
 */
function startDashboard() {
  console.log('🚀 Starting Naming Convention Dashboard...');
  console.log('Monitoring directories:', DASHBOARD_CONFIG.directories.join(', '));
  
  // Initial run
  runDashboard();
  
  // Set up refresh interval
  const interval = setInterval(() => {
    runDashboard();
  }, DASHBOARD_CONFIG.refreshInterval);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down dashboard...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Run if called directly
if (require.main === module) {
  startDashboard();
}

module.exports = {
  startDashboard,
  updateStats,
  displayStats,
  DASHBOARD_CONFIG
};









