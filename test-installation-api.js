#!/usr/bin/env node

// Simple test for installation details API
const http = require('http');

const testInstallationDetails = () => {
  const data = JSON.stringify({
    application_id: 1,
    store_location: 'Ghazipur',
    plant_installation_date: '2026-01-20',
    technician_details: [
      { id: 1, name: 'Ram' },
      { id: 2, name: 'Shyam' }
    ],
    task_id: 1
  });

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/installation-details',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(data);
  req.end();
};

// Wait a bit and test
setTimeout(testInstallationDetails, 2000);
