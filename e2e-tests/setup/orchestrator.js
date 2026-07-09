const SetupContext = require('./modules/context');
const { login } = require('./modules/auth');
const { configurePermissions } = require('./modules/permissions');
const { provisionSite } = require('./modules/site');
const CommerceSeeder = require('./modules/seeders/commerce');
const ObjectSeeder = require('./modules/seeders/objects');
const PageSeeder = require('./modules/seeders/pages');

async function globalSetup(config) {
  if (process.env.SKIP_GLOBAL_SETUP === 'true') {
    console.log(
      '  -> SKIP_GLOBAL_SETUP is true. Skipping global setup execution.'
    );
    return;
  }

  const ctx = new SetupContext(config);

  // 1. Authenticate and save state
  const { browser, page } = await login(ctx);

  try {
    // 2. Configure Service Access Policy & Guest Object definition/role permissions
    await configurePermissions(ctx, page);

    // Close page and browser as they are no longer needed
    await page.close();
    await browser.close();

    // 3. Create fresh API context for REST and JSON WS requests
    const apiContext = await ctx.createApiContext();

    try {
      // 4. Provision Site and layouts scan
      await provisionSite(ctx, apiContext);

      // 5. Seed general custom object entries (from showcase)
      await ObjectSeeder.seed(ctx, apiContext);

      // 6. Seed commerce catalogs, channels, categories, products
      await CommerceSeeder.seed(ctx, apiContext);

      // 7. Seed test pages, which triggers nested seeders per manifest (picklists, documents, collections)
      await PageSeeder.seed(ctx, apiContext);

      // 8. Filter and save generated pages manifest file
      ctx.saveTestPages();
    } finally {
      await apiContext.dispose();
    }
  } catch (err) {
    console.error('Setup failed with error:', err);
    throw err;
  }
}

module.exports = globalSetup;
