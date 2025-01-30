const request = require('supertest');
const app = require('../service');
const utils = require('../utils/testUtils');

let adminUser;
let adminUserAuthToken;

beforeAll(async () => {
  adminUser = {...utils.createUser(), roles: [{ role: 'admin' }]};
  const registerRes = await request(app).post('/api/auth').send(adminUser);
  adminUserAuthToken = registerRes.body.token;
  utils.expectValidJwt(adminUserAuthToken);
});

test('Placeholder', () => {
    console.log('Placeholder')
});