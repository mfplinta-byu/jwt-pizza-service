const request = require('supertest');
const app = require('../service');
const utils = require('../utils/testUtils');

let adminUserAuthToken;
let franchiseUser1 = utils.createUser();
let franchiseUser2 = utils.createUser();
let dinerUser = utils.createUser();
let testFranchisesUser1 = [
  {name: utils.randomText(5), admins: [{email: franchiseUser1.email}]},
  {name: utils.randomText(5), admins: [{email: franchiseUser1.email}]},
];
let testFranchisesUser2 = [
  {name: utils.randomText(5), admins: [{email: franchiseUser2.email}]},
  {name: utils.randomText(5), admins: [{email: franchiseUser2.email}]}
];

let testFranchises = testFranchisesUser1.concat(testFranchisesUser2);

beforeAll(async () => {
  // Fix race condition on login
  jest.useFakeTimers({ advanceTimers: true });
  jest.advanceTimersByTime(20000);
  // Login admin user
  const loginAdminRes = await request(app).put('/api/auth').send(utils.adminUser);
  expect(loginAdminRes.status).toBe(200);
  adminUserAuthToken = loginAdminRes.body.token;
  utils.expectValidJwt(adminUserAuthToken);

  // Create utility users
  let franchiseUser1Res = await request(app).post('/api/auth').send(franchiseUser1);
  let franchiseUser2Res = await request(app).post('/api/auth').send(franchiseUser2);
  let dinerUserRes = await request(app).post('/api/auth').send(dinerUser);

  expect(franchiseUser1Res.status).toBe(200);
  expect(franchiseUser2Res.status).toBe(200);
  expect(dinerUserRes.status).toBe(200);
  franchiseUser1 = {...franchiseUser1, id: franchiseUser1Res.body.user.id, token: franchiseUser1Res.body.token};
  franchiseUser2 = {...franchiseUser2, id: franchiseUser2Res.body.user.id, token: franchiseUser2Res.body.token};
  dinerUser = {...dinerUser, token: dinerUserRes.body.token};

  // Add franchises to database
  let franchisesWithId = [];

  for (const franchise of testFranchises) {
    const createFranchiseRes = await request(app)
    .post('/api/franchise')
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send(franchise);
    expect(createFranchiseRes.status).toBe(200);
    franchisesWithId.push({...franchise, id: createFranchiseRes.body.id})
  }

  testFranchises = franchisesWithId;

});

test('get franchises unauthenticated success', async () => {
  const getFranchiseRes = await request(app).get('/api/franchise');

  expect(getFranchiseRes.status).toBe(200);
  expectFranchisesToExist(testFranchises, getFranchiseRes.body);
});

test('get franchises as admin success', async () => {
  const getFranchiseRes = await request(app)
    .get('/api/franchise')
    .set('Authorization', 'Bearer ' + adminUserAuthToken);

  expect(getFranchiseRes.status).toBe(200);
  expectFranchisesToExist(testFranchises, getFranchiseRes.body);
});

test('get franchises from user success', async () => {
  let getFranchiseRes = await request(app)
    .get(`/api/franchise/${franchiseUser1.id}`)
    .set('Authorization', 'Bearer ' + adminUserAuthToken);

  expect(getFranchiseRes.status).toBe(200);
  expectFranchisesToExist(testFranchisesUser1, getFranchiseRes.body);

  getFranchiseRes = await request(app)
  .get(`/api/franchise/${franchiseUser2.id}`)
  .set('Authorization', 'Bearer ' + adminUserAuthToken);

  expectFranchisesToExist(testFranchisesUser2, getFranchiseRes.body);
});

test('get franchises from user empty', async () => {
  let getFranchiseRes = await request(app)
    .get(`/api/franchise/${dinerUser.id}`)
    .set('Authorization', 'Bearer ' + adminUserAuthToken);

  expect(getFranchiseRes.status).toBe(200);
  expect(getFranchiseRes.body).toMatchObject([]);
});

test('create franchise success', async () => {
  const createFranchiseRes = await request(app)
    .post('/api/franchise')
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send({name: utils.randomText(5), admins: [{email: franchiseUser1.email}]});

  expect(createFranchiseRes.status).toBe(200);
});

test('create franchise with unknown admin', async () => {
  const createFranchiseRes = await request(app)
    .post('/api/franchise')
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send({name: utils.randomText(5), admins: [{email: utils.randomText(10)}]});

  expect(createFranchiseRes.status).toBe(404);
});

test('create franchise as non-admin user unauthorized', async () => {
  const createFranchiseRes = await request(app)
    .post('/api/franchise')
    .set('Authorization', 'Bearer ' + dinerUser.token)
    .send({name: utils.randomText(5), admins: [{email: franchiseUser1.email}]});

  expect(createFranchiseRes.status).toBe(403);
});



test('delete franchise success', async () => {
  let newFranchise = {name: utils.randomText(5), admins: [{email: franchiseUser1.email}]};

  const createFranchiseRes = await request(app)
    .post('/api/franchise')
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send(newFranchise);

  expect(createFranchiseRes.status).toBe(200);
  newFranchise = {...newFranchise, id: createFranchiseRes.body.id};

  const deleteFranchiseRes = await request(app)
    .delete(`/api/franchise/${newFranchise.id}`)
    .set('Authorization', 'Bearer ' + adminUserAuthToken);
  expect(deleteFranchiseRes.status).toBe(200);
});

test('delete franchise unauthorized', async () => {
  const deleteFranchiseRes = await request(app)
    .delete(`/api/franchise/${testFranchises[0].id}`)
    .set('Authorization', 'Bearer ' + dinerUser.token);
  expect(deleteFranchiseRes.status).toBe(403);
});

test('create store success', async () => {
  const createStoreRes = await request(app)
    .post(`/api/franchise/${testFranchises[0].id}/store`)
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send({"franchiseId": testFranchises[0].id, name: utils.randomText(5)})
  expect(createStoreRes.status).toBe(200);
});

test('create store unauthorized', async () => {
  const createStoreRes = await request(app)
    .post(`/api/franchise/${testFranchises[0].id}/store`)
    .set('Authorization', 'Bearer ' + dinerUser.token)
    .send({"franchiseId": testFranchises[0].id, name: utils.randomText(5)})
  expect(createStoreRes.status).toBe(403);
});

test('delete store success', async () => {
  let newStore = {"franchiseId": testFranchises[0].id, name: utils.randomText(5)};

  const createStoreRes = await request(app)
    .post(`/api/franchise/${testFranchises[0].id}/store`)
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send(newStore);

  expect(createStoreRes.status).toBe(200);
  newStore = {...newStore, id: createStoreRes.body.id};

  const deleteStoreRes = await request(app)
    .delete(`/api/franchise/${testFranchises[0].id}/store/${newStore.id}`)
    .set('Authorization', 'Bearer ' + adminUserAuthToken);
  expect(deleteStoreRes.status).toBe(200);
});

test('delete store failure', async () => {
  let newStore = {"franchiseId": testFranchises[0].id, name: utils.randomText(5)};

  const createStoreRes = await request(app)
    .post(`/api/franchise/${testFranchises[0].id}/store`)
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send(newStore);

  expect(createStoreRes.status).toBe(200);
  newStore = {...newStore, id: createStoreRes.body.id};

  const deleteStoreRes = await request(app)
    .delete(`/api/franchise/${testFranchises[0].id}/store/${newStore.id}`)
    .set('Authorization', 'Bearer ' + dinerUser.token);
  expect(deleteStoreRes.status).toBe(403);
});

afterAll(async () => {
  // Cleanup
  for(const franchise of testFranchises) {
    expect((await request(app)
    .delete(`/api/franchise/${franchise.id}`)
    .set('Authorization', 'Bearer ' + adminUserAuthToken)).status).toBe(200);
  }

  jest.useRealTimers();
});

function expectFranchisesToExist(franchises, responseBody) {
  for(const franchise of franchises) {
    expect(responseBody.some(item => item.name === franchise.name)).toBe(true);
  }
}