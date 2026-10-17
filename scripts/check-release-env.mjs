#!/usr/bin/env node
// Release builds need real values for everything the app shows players and parents: the backend,
// challenge links and the operator details in the privacy policy (src/features/legal).
// Runs as the eas-build-post-install hook; only production builds are checked there.
const required = {
  EXPO_PUBLIC_CONTACT_EMAIL: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  EXPO_PUBLIC_DATA_REGION: (value) => value.length > 1,
  EXPO_PUBLIC_LEGAL_DEVELOPER: (value) => value.length > 1,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: (value) => value.length > 20,
  EXPO_PUBLIC_SUPABASE_URL: (value) => /^https:\/\//.test(value) && !/localhost|127\.0\.0\.1/.test(value),
  EXPO_PUBLIC_WEB_URL: (value) => /^https:\/\//.test(value),
};

const profile = process.env.EAS_BUILD_PROFILE;

if (process.argv.includes('--eas-hook') && profile !== 'production') {
  console.log(`Release env check skipped for EAS profile "${profile ?? 'local'}".`);
  process.exit(0);
}

const problems = Object.entries(required)
  .filter(([name, isValid]) => !isValid(process.env[name]?.trim() ?? ''))
  .map(([name]) => name);

if (problems.length > 0) {
  console.error(`Release env check failed. Set real values for: ${problems.join(', ')}`);
  process.exit(1);
}

console.log('Release env check passed.');
