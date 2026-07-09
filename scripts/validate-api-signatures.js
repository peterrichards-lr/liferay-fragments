#!/usr/bin/env node
/**
 * Issue #67: Automated JSON-WS Signature Verification Diagnostics
 *
 * Queries Liferay's /api/jsonws endpoint to verify that critical service
 * methods contain the expected parameter signatures. Liferay DXP quarterly
 * updates and service packs occasionally rename or reorder parameters (e.g.
 * 'name' -> 'title' in AssetListEntry), causing silent failures in setup tasks.
 *
 * Run standalone:   node scripts/validate-api-signatures.js
 * Used in setup:    Integrated via e2e-tests/tests/global-setup.js
 */

'use strict';

const https = require('http');
const url = require('url');

// ---------------------------------------------------------------------------
// Signature manifest: define the methods and their expected parameter names.
// Add entries here when a new DXP version changes a service signature.
// ---------------------------------------------------------------------------
const EXPECTED_SIGNATURES = [
  {
    contextName: 'assetlist',
    service: 'assetlist.assetlistentry',
    method: 'add-asset-list-entry',
    // DXP 2026.Q1+: 'title' replaced 'name'. If 'name' is missing it's OK;
    // if 'title' is missing on an older instance, it's a mismatch.
    mustContainAny: ['title', 'name'],
    description: 'AssetListEntry creation parameter (title vs name)',
  },
  {
    contextName: '',
    service: 'resourcepermission',
    method: 'add-resource-permission',
    mustContainAll: ['companyId', 'groupId', 'name', 'scope', 'primKey', 'roleId', 'actionId'],
    description: 'ResourcePermission add action parameters',
  },
  {
    contextName: '',
    service: 'layout',
    method: 'delete-layout',
    mustContainAll: ['groupId', 'privateLayout', 'layoutId'],
    description: 'Layout delete parameters',
  },
  {
    contextName: 'fragment',
    service: 'fragment.fragmentcollection',
    method: 'get-fragment-collections',
    mustContainAll: ['groupId'],
    description: 'Fragment collection query parameters',
  },
];

// ---------------------------------------------------------------------------
// Helper: fetch the JSON-WS signature page for a given service/method
// ---------------------------------------------------------------------------
async function fetchSignaturePage(baseUrl, service, method, contextName) {
  // Liferay renders the parameter form when the full signature URL is used.
  // We query the listing page and look for the method signature link, then
  // parse param names from all textarea/input elements inside the form.
  const methodPath = `/${service}/${method}`;
  const ctx = contextName !== undefined ? contextName : '';
  const pageUrl = `${baseUrl}/api/jsonws?contextName=${encodeURIComponent(ctx)}&keywords=${encodeURIComponent(method)}`;

  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(pageUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 8080,
      path: parsedUrl.path,
      method: 'GET',
      auth: `${process.env.LIFERAY_USER || 'test@liferay.com'}:${process.env.LIFERAY_PASSWORD || 'test'}`,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        // Find the first signature href that matches our service/method
        const hrefMatch = data.match(
          new RegExp(`signature=(${encodeURIComponent(methodPath).replace(/\//g, '%2F')}[^"&]*)`)
        );
        if (!hrefMatch) {
          resolve({ status: res.statusCode, body: data, sigUrl: null });
          return;
        }
        // Now fetch the specific signature page to get the form
        const sigUrl = `${baseUrl}/api/jsonws?contextName=&signature=${hrefMatch[1]}`;
        const sigParsed = url.parse(sigUrl);
        const sigOpts = {
          hostname: sigParsed.hostname,
          port: sigParsed.port || 8080,
          path: sigParsed.path,
          method: 'GET',
          auth: options.auth,
        };
        const req2 = https.request(sigOpts, (res2) => {
          let body2 = '';
          res2.on('data', (c) => (body2 += c));
          res2.on('end', () => resolve({ status: res2.statusCode, body: body2, sigUrl }));
        });
        req2.on('error', reject);
        req2.setTimeout(10000, () => { req2.destroy(); reject(new Error('Timeout on sig fetch')); });
        req2.end();
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${pageUrl}`));
    });
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Main validation function
// ---------------------------------------------------------------------------
async function validateSignatures(baseUrl) {
  baseUrl = baseUrl || process.env.BASE_URL || 'http://localhost:8080';
  console.log(`\n[Signature Validator] Connecting to: ${baseUrl}`);
  console.log('[Signature Validator] Verifying critical JSON-WS method signatures...\n');

  const results = [];
  let hasWarnings = false;

  for (const check of EXPECTED_SIGNATURES) {
    const { contextName, service, method, mustContainAll, mustContainAny, description } = check;
    process.stdout.write(`  Checking /${service}/${method} (${description})... `);

    let result = { service, method, status: 'OK', warnings: [] };

    try {
      const { status, body } = await fetchSignaturePage(baseUrl, service, method, contextName);

      if (status !== 200) {
        result.status = 'ERROR';
        result.warnings.push(`HTTP ${status} — method may not exist`);
      } else {
        // Extract parameter names from form input/textarea name attributes
        const paramMatches = [...body.matchAll(/name="([a-zA-Z][a-zA-Z0-9_]*)"/g)];
        const params = paramMatches
          .map((m) => m[1])
          .filter((p) => !['formDate', 'p_auth', 'contextName', 'serviceSearch', 'result', 'execute'].includes(p))
          .filter((v, i, a) => a.indexOf(v) === i); // deduplicate

        if (mustContainAll) {
          for (const param of mustContainAll) {
            if (!params.includes(param)) {
              result.status = 'WARN';
              result.warnings.push(`Expected parameter '${param}' not found. Found: [${params.join(', ')}]`);
            }
          }
        }

        if (mustContainAny) {
          const anyFound = mustContainAny.some((p) => params.includes(p));
          if (!anyFound) {
            result.status = 'WARN';
            result.warnings.push(
              `None of expected parameters [${mustContainAny.join(', ')}] found. Found: [${params.join(', ')}]`
            );
          } else {
            // Report which one was found for informational purposes
            const found = mustContainAny.find((p) => params.includes(p));
            result.foundParam = found;
          }
        }
      }
    } catch (err) {
      result.status = 'ERROR';
      result.warnings.push(`Request failed: ${err.message}`);
    }

    if (result.status === 'OK') {
      console.log('\x1b[32m✓ OK\x1b[0m');
    } else if (result.status === 'WARN') {
      console.log('\x1b[33m⚠ WARN\x1b[0m');
      result.warnings.forEach((w) => console.log(`     \x1b[33m↳ ${w}\x1b[0m`));
      hasWarnings = true;
    } else {
      console.log('\x1b[31m✗ ERROR\x1b[0m');
      result.warnings.forEach((w) => console.log(`     \x1b[31m↳ ${w}\x1b[0m`));
      hasWarnings = true;
    }

    results.push(result);
  }

  console.log('\n[Signature Validator] Validation complete.');

  if (hasWarnings) {
    console.log('\x1b[33m[Signature Validator] ⚠ Some signatures may have drifted.\x1b[0m');
    console.log('\x1b[33m  → Review the warnings above and update the seeder form payloads accordingly.\x1b[0m');
    console.log('\x1b[33m  → Update EXPECTED_SIGNATURES in scripts/validate-api-signatures.js if intentional.\x1b[0m');
  } else {
    console.log('\x1b[32m[Signature Validator] ✓ All signatures match expectations.\x1b[0m');
  }

  return results;
}

// Run standalone if called directly
if (require.main === module) {
  validateSignatures()
    .then((results) => {
      const hasErrors = results.some((r) => r.status === 'ERROR');
      process.exit(hasErrors ? 1 : 0);
    })
    .catch((err) => {
      console.error('[Signature Validator] Fatal error:', err.message);
      process.exit(1);
    });
}

module.exports = { validateSignatures };
