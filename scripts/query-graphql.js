// scripts/query-graphql.js
const http = require('http');

const auth = Buffer.from('test@liferay.com:test').toString('base64');
const hostname = 'localhost';
const port = 8080;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function queryGraphQL(query, variables = {}) {
  const postData = JSON.stringify({ query, variables });
  const options = {
    hostname,
    port,
    path: '/o/graphql',
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + auth,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      Accept: 'application/json',
    },
  };
  const res = await makeRequest(options, postData);
  if (res.statusCode !== 200) {
    throw new Error(`GraphQL returned status ${res.statusCode}: ${res.data}`);
  }
  return JSON.parse(res.data);
}

async function run() {
  console.log(
    'Introspecting Liferay GraphQL mutations for ContentStructure...'
  );

  // Introspect mutations related to content structures
  const query = `
    query {
      __schema {
        mutationType {
          name
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await queryGraphQL(query);
    const mutations = result.data.__schema.mutationType.fields;
    console.log(`Found ${mutations.length} mutations.`);

    console.log('Matching mutations:');
    mutations.forEach((m) => {
      if (
        m.name.toLowerCase().includes('structure') ||
        m.name.toLowerCase().includes('content')
      ) {
        console.log(`- Mutation: ${m.name}`);
        console.log(`  Description: ${m.description || 'none'}`);
        console.log(
          `  Args: ${m.args.map((a) => `${a.name}: ${a.type.name || a.type.kind}`).join(', ')}`
        );
      }
    });
  } catch (err) {
    console.error('GraphQL Query Failed:', err.message);
  }
}

run();
