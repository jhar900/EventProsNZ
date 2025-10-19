const fs = require('fs');
const path = require('path');

// List of CRM API files that need security middleware
const crmFiles = [
  'app/api/crm/messages/route.ts',
  'app/api/crm/notes/route.ts',
  'app/api/crm/reminders/route.ts',
  'app/api/crm/search/route.ts',
  'app/api/crm/export/route.ts',
  'app/api/crm/timeline/route.ts',
];

// Security imports to add
const securityImports = `import {
  withSecurity,
  crmSecurityConfig,
} from '@/lib/security/security-middleware';
import { textSanitizer } from '@/lib/security/input-sanitization';`;

// Function to add security middleware to a file
function addSecurityToFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if security is already added
    if (content.includes('withSecurity')) {
      console.log(`Security already added to ${filePath}`);
      return;
    }

    // Add security imports after the existing imports
    const importRegex = /(import.*from.*['"][^'"]*['"];?\s*)+/;
    const match = content.match(importRegex);
    if (match) {
      const imports = match[0];
      const newImports = imports + '\n' + securityImports + '\n';
      content = content.replace(imports, newImports);
    }

    // Wrap GET functions
    content = content.replace(
      /export async function GET\(request: NextRequest\) \{\s*try \{/g,
      'export async function GET(request: NextRequest) {\n  return withSecurity(\n    request,\n    async () => {\n      try {'
    );

    // Close GET functions
    content = content.replace(
      /(\s+}\s+} catch \(error\) \{\s+console\.error\([^}]+\);\s+return NextResponse\.json\(\s+\{ success: false, message: [^}]+ \},\s+\{ status: 500 \}\s+\);\s+}\s+}\s*$)/m,
      '$1    },\n    crmSecurityConfig\n  );\n}'
    );

    // Wrap POST functions
    content = content.replace(
      /export async function POST\(request: NextRequest\) \{\s*try \{/g,
      'export async function POST(request: NextRequest) {\n  return withSecurity(\n    request,\n    async () => {\n      try {'
    );

    // Add input sanitization to POST functions
    content = content.replace(
      /(\s+const body = await request\.json\(\);)/g,
      '$1\n\n        // Sanitize input data\n        const sanitizedBody = textSanitizer.sanitizeObject(body);'
    );

    // Update validation to use sanitized body
    content = content.replace(
      /(\s+const validationResult = \w+Schema\.safeParse\(body\);)/g,
      '$1.replace("body", "sanitizedBody")'
    );

    // Close POST functions
    content = content.replace(
      /(\s+}\s+} catch \(error\) \{\s+console\.error\([^}]+\);\s+return NextResponse\.json\(\s+\{ success: false, message: [^}]+ \},\s+\{ status: 500 \}\s+\);\s+}\s+}\s*$)/m,
      '$1    },\n    crmSecurityConfig\n  );\n}'
    );

    fs.writeFileSync(filePath, content);
    console.log(`Security added to ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Process all files
crmFiles.forEach(file => {
  if (fs.existsSync(file)) {
    addSecurityToFile(file);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Security middleware addition complete!');
