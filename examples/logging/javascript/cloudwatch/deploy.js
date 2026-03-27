/**
 * Deploy CloudWatch Logs Insights saved queries from queries.json.
 *
 * Usage:
 *   node deploy.js                 # Create or update all queries
 *   node deploy.js --delete-first  # Delete existing queries with matching prefix, then create
 *   node deploy.js --verbose       # Show detailed AWS error output
 *
 * Requires: AWS CLI (configured), Node.js 18+
 * Region:   reads AWS_REGION env var (defaults to us-east-1)
 */

const { execSync } = require('node:child_process');
const { readFileSync, writeFileSync, unlinkSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { randomUUID } = require('node:crypto');

const REGION = process.env.AWS_REGION || 'us-east-1';
const DELETE_FIRST = process.argv.includes('--delete-first');
const VERBOSE = process.argv.includes('--verbose');

// ---------------------------------------------------------------------------
// AWS CLI wrapper
// ---------------------------------------------------------------------------

function aws(args) {
  const cmd = `aws ${args} --region ${REGION}`;
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    if (VERBOSE) console.error(`  AWS error: ${err.stderr || err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Query CRUD
// ---------------------------------------------------------------------------

/**
 * Create or update a saved query definition.
 * Uses a temp file with file:// URI to avoid shell-escaping issues
 * with newlines, pipes, and special characters in query strings.
 */
function putQueryDefinition(name, logGroup, queryString, existingId) {
  const tmpFile = join(tmpdir(), `cw-query-${randomUUID()}.json`);
  try {
    const payload = { name, logGroupNames: [logGroup], queryString };
    if (existingId) payload.queryDefinitionId = existingId;
    writeFileSync(tmpFile, JSON.stringify(payload));
    const fileUri = `file://${tmpFile}`;
    return aws(`logs put-query-definition --cli-input-json "${fileUri}"`);
  } finally {
    try { unlinkSync(tmpFile); } catch { /* best-effort cleanup */ }
  }
}

/** Fetch existing query definitions and return Map<name, queryDefinitionId>. */
function getExistingQueries(prefix) {
  const raw = aws(
    `logs describe-query-definitions --query-definition-name-prefix "${prefix}" --output json`,
  );
  if (!raw) return new Map();
  try {
    const data = JSON.parse(raw);
    return new Map(
      (data.queryDefinitions || []).map((q) => [q.name, q.queryDefinitionId]),
    );
  } catch {
    return new Map();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const queriesFile = JSON.parse(
  readFileSync(join(__dirname, 'queries.json'), 'utf-8'),
);
const { logGroup, queryPrefix, queries } = queriesFile;

console.log(`Log group:    ${logGroup}`);
console.log(`Query prefix: ${queryPrefix}`);
console.log(`Queries:      ${queries.length}`);
console.log(`Region:       ${REGION}`);
console.log('');

// Verify AWS access
const account = aws('sts get-caller-identity --query Account --output text');
if (!account) {
  console.error('ERROR: Cannot reach AWS. Check credentials and region.');
  if (!VERBOSE) console.error('  Run with --verbose for details.');
  process.exit(1);
}
console.log(`AWS Account:  ${account}`);
console.log('');

// Optionally delete existing queries first
if (DELETE_FIRST) {
  console.log(`Deleting existing queries with prefix '${queryPrefix}/'...`);
  const raw = aws(
    `logs describe-query-definitions --query-definition-name-prefix "${queryPrefix}/" --query "queryDefinitions[].queryDefinitionId" --output text`,
  );
  if (raw) {
    const ids = raw.split(/\s+/).filter(Boolean);
    for (const id of ids) {
      process.stdout.write(`  Deleting ${id} ... `);
      aws(`logs delete-query-definition --query-definition-id "${id}"`);
      console.log('OK');
    }
  }
  console.log('');
}

// Fetch existing to detect create vs update
const existing = getExistingQueries(queryPrefix);
if (existing.size > 0) {
  console.log(`Found ${existing.size} existing queries to update`);
  console.log('');
}

// Deploy
let created = 0;
let updated = 0;
let failed = 0;

for (const q of queries) {
  const existingId = existing.get(q.name);
  process.stdout.write(`  ${q.name} ... `);
  const result = putQueryDefinition(q.name, logGroup, q.query, existingId);
  if (result) {
    console.log(existingId ? 'UPDATED' : 'CREATED');
    existingId ? updated++ : created++;
  } else {
    console.log('FAILED');
    failed++;
  }
}

console.log('');
console.log(`Done: ${created} created, ${updated} updated, ${failed} failed`);
if (failed > 0) process.exit(1);
