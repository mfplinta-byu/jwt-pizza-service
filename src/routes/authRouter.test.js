const request = require('supertest');
const app = require('../service');
const utils = require('../utils/testUtils')

let adminUserAuthToken;
let adminUserId;
let testUserAuthToken;
let testUser;

beforeAll(async () => {
  // Login admin user
  const loginAdminRes = await request(app).put('/api/auth').send(utils.adminUser);
  expect(loginAdminRes.status).toBe(200);
  adminUserAuthToken = loginAdminRes.body.token;
  adminUserId = loginAdminRes.body.user.id;
  utils.expectValidJwt(adminUserAuthToken);

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

test('login unknown user', async () => {
  const loginRes = await request(app).put('/api/auth').send(utils.createUser());
  expect(loginRes.status).toBe(404);
});

test('login bad request', async () => {
  const loginRes = await request(app).post('/api/auth').send({});
  expect(loginRes.status).toBe(400);
});

test('update user success', async () => {
  let newUser = utils.createUser();
  const registerRes = await request(app).post('/api/auth').send(newUser);
  expect(registerRes.status).toBe(200);
  newUser = {...newUser, id: registerRes.body.user.id};

  const updateUserRes = await request(app)
    .put(`/api/auth/${newUser.id}`)
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send({email: newUser.email, password: 'test'});
  expect(updateUserRes.status).toBe(200);
});

test('update user unauthorized', async () => {
  const updateUserRes = await request(app)
    .put(`/api/auth/${adminUserId}`)
    .set('Authorization', 'Bearer ' + testUserAuthToken)
    .send({email: utils.adminUser.email, password: 'test'});
  expect(updateUserRes.status).toBe(403);
});

test('logout success', async () => {
  const logoutRes = await request(app)
    .delete('/api/auth')
    .set('Authorization', 'Bearer ' + testUserAuthToken);
  expect(logoutRes.status).toBe(200);
});

test('logout unauthorized', async () => {
  const logoutRes = await request(app).delete('/api/auth');
  expect(logoutRes.status).toBe(401);
});