// scripts/query-batch-tasks.js
const http = require('http');

const auth = Buffer.from('test@liferay.com:test').toString('base64');
const hostname = 'localhost';
const port = 8080;

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Fetching headless-batch-engine import tasks...');
  const options = {
    hostname,
    port,
    path: '/o/headless-batch-engine/v1.0/import-tasks',
    method: 'GET',
    headers: {
      Authorization: 'Basic ' + auth,
      Accept: 'application/json',
    },
  };

  try {
    const res = await makeRequest(options);
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      const json = JSON.parse(res.data);
      console.log(`Total tasks: ${json.totalCount}`);
      // Show details of the last 15 tasks
      const tasks = (json.items || []).slice(0, 15);
      tasks.forEach((task) => {
        console.log(`- Task ID: ${task.id}`);
        console.log(`  Class Name: ${task.className}`);
        console.log(`  Execute Status: ${task.executeStatus}`);
        console.log(`  Created: ${task.createDate}`);
        if (task.errorMessage || task.failedItemsCount > 0) {
          console.log(`  Error Message: ${task.errorMessage}`);
          console.log(`  Failed Items: ${task.failedItemsCount}`);
        }
      });
    } else {
      console.log('Error output:', res.data);
    }
  } catch (err) {
    console.error('Failed to query batch tasks:', err.message);
  }
}

run();
