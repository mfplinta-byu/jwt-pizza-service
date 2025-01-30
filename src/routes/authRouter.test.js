const request = require('supertest');
const app = require('../service');
const utils = require('../utils/testUtils')

let testUserAuthToken;
let testUser;

beforeAll(async () => {
  testUser = utils.createUser();
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  utils.expectValidJwt(testUserAuthToken);
});

test('endpoint invalid methods', async () => {
  expect((await request(app).get('/api/auth')).status).toBe(404);
});

test('register success', async () => {
  const registerUser = utils.createUser();
  const registerRes = await request(app).post('/api/auth').send(registerUser);

  utils.expectValidJwt(registerRes.body.token);
  expect(registerRes.status).toBe(200);

  const expectedUser = { ...registerUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(registerRes.body.user).toMatchObject(expectedUser);
});

test('register bad request', async () => {
  const registerRes = await request(app).post('/api/auth').send({});
  expect(registerRes.status).toBe(400);
});

test('login success', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  utils.expectValidJwt(loginRes.body.token);

  const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

test('login bad request', async () => {
  const loginRes = await request(app).post('/api/auth').send({});
  expect(loginRes.status).toBe(400);
})

test('logout success', async () => {
  const logoutRes = await request(app).delete('/api/auth').set('Authorization', 'Bearer ' + testUserAuthToken);
  expect(logoutRes.status).toBe(200);
});

test('logout unauthorized', async () => {
  const logoutRes = await request(app).delete('/api/auth');
  expect(logoutRes.status).toBe(401);
});