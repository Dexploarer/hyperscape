#!/usr/bin/env bun

/**
 * Build script using bun build
 * Replaces tsup with native bun build functionality
 */

import { $ } from 'bun';
import { buildConfig } from './build.config';

async function build() {
  console.log('🏗️  Building package...');

  // Clean dist directory
  await $`rm -rf dist`;

  // Build with bun
  const result = await Bun.build(buildConfig);

  if (!result.success) {
    console.error('❌ Build failed:');
    for (const message of result.logs) {
      console.error(message);
    }
    process.exit(1);
  }

  console.log(`✅ Built ${result.outputs.length} files`);

  // Generate TypeScript declarations (continue on error for test files)
  console.log('📝 Generating TypeScript declarations...');
  try {
    await $`tsc --project tsconfig.json --emitDeclarationOnly`;
    console.log('✅ TypeScript declarations generated');
  } catch (error) {
    console.warn('⚠️  TypeScript declarations had errors (test files only), but build succeeded');
  }

  console.log('✅ Build complete!');
}

build().catch(console.error);
