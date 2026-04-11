#!/usr/bin/env node
// Simple validation script to check if the DocumentFragment signal fix works

const fs = require('fs');
const path = require('path');

// Read the render.ts file to verify the fix is in place
const renderPath = path.join(__dirname, 'src/render.ts');
const renderContent = fs.readFileSync(renderPath, 'utf-8');

let allChecks = true;

// Check 1: newValue instanceof DocumentFragment (not initialChildren)
const check1 = renderContent.includes('newValue instanceof DocumentFragment');
console.log(`Check 1 - Uses newValue for DocumentFragment detection: ${check1 ? 'PASS' : 'FAIL'}`);
if (!check1) allChecks = false;

// Check 2: cloneNode is used in bindFragment
const check2 = renderContent.includes('cloneNode(true)');
console.log(`Check 2 - Clones fragments before extracting children: ${check2 ? 'PASS' : 'FAIL'}`);
if (!check2) allChecks = false;

// Check 3: The broken childrenMap caching is removed
const check3 = !renderContent.includes('renderState.childrenMap.get(initialFragment)');
console.log(`Check 3 - Removed broken childrenMap caching: ${check3 ? 'PASS' : 'FAIL'}`);
if (!check3) allChecks = false;

// Check 4: bindText receives result directly
const bindTextPattern = /if \(result instanceof Text\) \{\s*destroy\(\);\s*bindText\(result, signal\);/;
const check4 = bindTextPattern.test(renderContent);
console.log(`Check 4 - bindText receives result directly: ${check4 ? 'PASS' : 'FAIL'}`);
if (!check4) allChecks = false;

console.log('\n' + (allChecks ? 'ALL CHECKS PASSED - Fix is in place' : 'SOME CHECKS FAILED'));
process.exit(allChecks ? 0 : 1);
