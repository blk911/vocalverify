#!/usr/bin/env node

/**
 * NAMING CONVENTION ENFORCEMENT TOOL
 * 
 * This tool scans the entire app for naming mismatches that cause
 * critical failures in basic functionality like invite forms.
 * 
 * Run: node scripts/naming-convention-audit.js
 */

const fs = require('fs');
const path = require('path');

// Define the CORRECT naming conventions
const CONVENTIONS = {
  // API Field Names
  INVITE_FIELDS: {
    correct: {
      name: 'invitedName',
      phone: 'invitedPhone', 
      sponsor: 'sponsorName',
      sponsorId: 'sponsorId',
      sponsorCode: 'sponsorMemberCode'
    },
    incorrect: {
      name: ['inviteeName', 'inviterName'],
      phone: ['inviteeEmail', 'inviterEmail'],
      sponsor: ['inviterName', 'inviterUid'],
      sponsorId: ['inviterUid', 'inviterId'],
      sponsorCode: ['inviterCode', 'inviterMemberCode']
    }
  },
  
  // API Endpoints
  ENDPOINTS: {
    correct: {
      sendInvite: '/api/invites/send',
      getInvites: '/api/admin/invite-history',
      getMemberInvites: '/api/member/invite-history'
    },
    incorrect: {
      sendInvite: ['/api/member/send-invitation', '/api/admin/send-invitation'],
      getInvites: ['/api/invites/list', '/api/invites/history']
    }
  },
  
  // Database Fields
  DATABASE_FIELDS: {
    correct: {
      name: 'name',
      phone: 'phone',
      sponsor: 'sponsorName',
      sponsorId: 'sponsorId',
      status: 'status',
      createdAt: 'createdAt'
    },
    incorrect: {
      name: ['inviteeName', 'inviterName'],
      phone: ['inviteeEmail', 'inviterEmail'],
      sponsor: ['inviterName'],
      sponsorId: ['inviterUid', 'inviterId']
    }
  }
};

class NamingConventionAuditor {
  constructor() {
    this.issues = [];
    this.srcPath = path.join(__dirname, '..', 'src');
  }

  async audit() {
    console.log('🔍 NAMING CONVENTION AUDIT STARTING...\n');
    
    await this.auditApiEndpoints();
    await this.auditFrontendForms();
    await this.auditDatabaseQueries();
    await this.testActualFlows();
    
    this.generateReport();
  }

  async auditApiEndpoints() {
    console.log('📡 AUDITING API ENDPOINTS...');
    
    const apiFiles = this.findFiles('src/app/api', '.ts');
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const issues = this.checkApiFile(content, file);
      this.issues.push(...issues);
    }
  }

  async auditFrontendForms() {
    console.log('🎨 AUDITING FRONTEND FORMS...');
    
    const componentFiles = this.findFiles('src/components', '.tsx');
    const pageFiles = this.findFiles('src/app', '.tsx');
    
    for (const file of [...componentFiles, ...pageFiles]) {
      const content = fs.readFileSync(file, 'utf8');
      const issues = this.checkFrontendFile(content, file);
      this.issues.push(...issues);
    }
  }

  async auditDatabaseQueries() {
    console.log('🗄️ AUDITING DATABASE QUERIES...');
    
    const apiFiles = this.findFiles('src/app/api', '.ts');
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const issues = this.checkDatabaseFile(content, file);
      this.issues.push(...issues);
    }
  }

  async testActualFlows() {
    console.log('🧪 TESTING ACTUAL API FLOWS...');
    
    // Test invite send flow
    try {
      const testData = {
        memberCode: "test123",
        invitedName: "Test User", 
        invitedPhone: "5551234567"
      };
      
      // This would need to be run against actual server
      console.log('   ⚠️  Manual test required: POST /api/invites/send');
      console.log('   ⚠️  Manual test required: GET /api/admin/invite-history');
      
    } catch (error) {
      this.issues.push({
        type: 'FLOW_TEST',
        severity: 'HIGH',
        file: 'API_FLOW_TEST',
        line: 0,
        message: `API flow test failed: ${error.message}`,
        suggestion: 'Test actual POST/GET requests against running server'
      });
    }
  }

  checkApiFile(content, filePath) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for incorrect field names in API endpoints
      Object.entries(CONVENTIONS.INVITE_FIELDS.incorrect).forEach(([correctField, incorrectFields]) => {
        incorrectFields.forEach(incorrectField => {
          if (line.includes(incorrectField)) {
            issues.push({
              type: 'FIELD_NAME',
              severity: 'HIGH',
              file: filePath,
              line: index + 1,
              message: `Found incorrect field name: ${incorrectField}`,
              suggestion: `Should use: ${CONVENTIONS.INVITE_FIELDS.correct[correctField]}`,
              code: line.trim()
            });
          }
        });
      });
      
      // Check for incorrect endpoint usage
      Object.entries(CONVENTIONS.ENDPOINTS.incorrect).forEach(([correctEndpoint, incorrectEndpoints]) => {
        incorrectEndpoints.forEach(incorrectEndpoint => {
          if (line.includes(incorrectEndpoint)) {
            issues.push({
              type: 'ENDPOINT',
              severity: 'CRITICAL',
              file: filePath,
              line: index + 1,
              message: `Found incorrect endpoint: ${incorrectEndpoint}`,
              suggestion: `Should use: ${CONVENTIONS.ENDPOINTS.correct[correctEndpoint]}`,
              code: line.trim()
            });
          }
        });
      });
    });
    
    return issues;
  }

  checkFrontendFile(content, filePath) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for incorrect field names in frontend
      Object.entries(CONVENTIONS.INVITE_FIELDS.incorrect).forEach(([correctField, incorrectFields]) => {
        incorrectFields.forEach(incorrectField => {
          if (line.includes(incorrectField)) {
            issues.push({
              type: 'FRONTEND_FIELD',
              severity: 'HIGH',
              file: filePath,
              line: index + 1,
              message: `Frontend using incorrect field: ${incorrectField}`,
              suggestion: `Should use: ${CONVENTIONS.INVITE_FIELDS.correct[correctField]}`,
              code: line.trim()
            });
          }
        });
      });
      
      // Check for incorrect API calls
      Object.entries(CONVENTIONS.ENDPOINTS.incorrect).forEach(([correctEndpoint, incorrectEndpoints]) => {
        incorrectEndpoints.forEach(incorrectEndpoint => {
          if (line.includes(incorrectEndpoint)) {
            issues.push({
              type: 'FRONTEND_ENDPOINT',
              severity: 'CRITICAL',
              file: filePath,
              line: index + 1,
              message: `Frontend calling incorrect endpoint: ${incorrectEndpoint}`,
              suggestion: `Should call: ${CONVENTIONS.ENDPOINTS.correct[correctEndpoint]}`,
              code: line.trim()
            });
          }
        });
      });
    });
    
    return issues;
  }

  checkDatabaseFile(content, filePath) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for incorrect database field names
      Object.entries(CONVENTIONS.DATABASE_FIELDS.incorrect).forEach(([correctField, incorrectFields]) => {
        incorrectFields.forEach(incorrectField => {
          if (line.includes(incorrectField)) {
            issues.push({
              type: 'DATABASE_FIELD',
              severity: 'HIGH',
              file: filePath,
              line: index + 1,
              message: `Database query using incorrect field: ${incorrectField}`,
              suggestion: `Should use: ${CONVENTIONS.DATABASE_FIELDS.correct[correctField]}`,
              code: line.trim()
            });
          }
        });
      });
    });
    
    return issues;
  }

  findFiles(dir, extension) {
    const files = [];
    
    function walkDir(currentPath) {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    }
    
    walkDir(dir);
    return files;
  }

  generateReport() {
    console.log('\n📊 NAMING CONVENTION AUDIT REPORT');
    console.log('=====================================\n');
    
    if (this.issues.length === 0) {
      console.log('✅ NO NAMING CONVENTION ISSUES FOUND!');
      return;
    }
    
    // Group issues by severity
    const critical = this.issues.filter(i => i.severity === 'CRITICAL');
    const high = this.issues.filter(i => i.severity === 'HIGH');
    const medium = this.issues.filter(i => i.severity === 'MEDIUM');
    
    console.log(`❌ CRITICAL ISSUES: ${critical.length}`);
    console.log(`⚠️  HIGH ISSUES: ${high.length}`);
    console.log(`ℹ️  MEDIUM ISSUES: ${medium.length}`);
    console.log(`📝 TOTAL ISSUES: ${this.issues.length}\n`);
    
    // Show critical issues
    if (critical.length > 0) {
      console.log('🚨 CRITICAL ISSUES (MUST FIX):');
      critical.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.type} - ${issue.file}:${issue.line}`);
        console.log(`   Message: ${issue.message}`);
        console.log(`   Suggestion: ${issue.suggestion}`);
        console.log(`   Code: ${issue.code}`);
      });
    }
    
    // Show high issues
    if (high.length > 0) {
      console.log('\n⚠️ HIGH ISSUES (SHOULD FIX):');
      high.slice(0, 10).forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.type} - ${issue.file}:${issue.line}`);
        console.log(`   Message: ${issue.message}`);
        console.log(`   Suggestion: ${issue.suggestion}`);
      });
      
      if (high.length > 10) {
        console.log(`\n... and ${high.length - 10} more high priority issues`);
      }
    }
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Fix all CRITICAL issues immediately');
    console.log('2. Standardize on invitedName/invitedPhone for all invite fields');
    console.log('3. Use /api/invites/send as the single invite endpoint');
    console.log('4. Implement automated tests to catch future mismatches');
    console.log('5. Add ESLint rules to enforce naming conventions');
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new NamingConventionAuditor();
  auditor.audit().catch(console.error);
}

module.exports = NamingConventionAuditor;
