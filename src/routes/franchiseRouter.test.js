const request = require('supertest');
const app = require('../service'); // Adjust the path to your app
const { Role } = require('../database/database.js'); // Adjust the path to your DB module
const utils = require('../routes/util.js');
let franchiseeUser;
let franchiseeUserAuthToken;
let franchiseId;
let storeId;
let newFranchise;
let slcFranchise;
let adminUserAuthToken = null;

beforeAll(async () => {
    franchiseeUser = {
        name: 'Franchisee User',
        email: 'franchisee@test.com',
        password: 'franchisee',
        roles: [{ role: Role.Franchisee }],
    };
    newFranchise = {
        name: 'Pizza Palace # ' + utils.randomText(5),
        admins: [{ email: franchiseeUser.email }],
    };

    slcFranchise = {
        name: 'SLC Franchise',
        admins: [{ email: franchiseeUser.email }],
    }


    adminUserAuthToken = await utils.getAdminAuthToken();
    utils.expectValidJwt(adminUserAuthToken);
  
    // Register the franchisee user
    const registerRes = await request(app).post('/api/auth').send(franchiseeUser);
    expect(registerRes.status).toBe(200);
    expect(registerRes.body.user.email).toBe(franchiseeUser.email);
    
    // Log in as the franchisee user
    const franchiseeLoginRes = await request(app)
      .put('/api/auth')
      .send({ email: 'franchisee@test.com', password: 'franchisee' }); // Use predefined franchisee credentials
    franchiseeUserAuthToken = franchiseeLoginRes.body.token;
});

describe('Franchises', () => {
// GET /api/franchise
test('get all franchises', async () => {
  const res = await request(app).get('/api/franchise');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

// GET /api/franchise/:userId
test('get franchises for a user', async () => {
  const res = await request(app)
    .get(`/api/franchise/${franchiseeUser.id}`)
    .set('Authorization', `Bearer ${franchiseeUserAuthToken}`);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

async function createFranchise(franchise) {
    let res = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${adminUserAuthToken}`)
        .send(franchise);

    return res
}
// POST /api/franchise
test('admin creates a new franchise', async () => {
  let res = await createFranchise(newFranchise);
  console.log(res.body);
  expect(res.status).toBe(200);
  expect(res.body.name).toBe(newFranchise.name);
  franchiseId = res.body.id; // Save the franchise ID for later tests, might need to be a beforeAll

  const remakeSLC = false;
  if (remakeSLC) {
    res = await createFranchise(slcFranchise);
    console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(slcFranchise.name);
  }
});

test('non-admin cannot create a franchise', async () => {
  const newFranchise = {
    name: 'Pizza Palace',
    admins: [{ email: franchiseeUser.email }],
  };

  const res = await request(app)
    .post('/api/franchise')
    .set('Authorization', `Bearer ${franchiseeUserAuthToken}`)
    .send(newFranchise);

  expect(res.status).toBe(403);
  expect(res.body.message).toBe('unable to create a franchise');
});

// DELETE /api/franchise/:franchiseId
test('admin deletes a franchise', async () => {
  const hold_delete = false;
  if (hold_delete){
    return;
  }
  let res = await request(app)
    .delete(`/api/franchise/${franchiseId}`)
    .set('Authorization', `Bearer ${adminUserAuthToken}`);

  expect(res.status).toBe(200);
  expect(res.body.message).toBe('franchise deleted');
});

test('non-admin cannot delete a franchise', async () => {
  const res = await request(app)
    .delete(`/api/franchise/${franchiseId}`)
    .set('Authorization', `Bearer ${franchiseeUserAuthToken}`);

  expect(res.status).toBe(403);
  expect(res.body.message).toBe('unable to delete a franchise');
});

});
//NOT WORKING FIGURE OUT LATER
// POST /api/franchise/:franchiseId/store
// test('admin creates a new store', async () => {
//     const newStore = { name: 'Downtown Store' };
    
//     const res = await request(app) 
//     .post(`/api/franchise/${franchiseId}/store`)
//     .set('Authorization', `Bearer ${adminUserAuthToken}`)
//     .send(newStore);

//     console.log(res.body);
//     expect(res.status).toBe(200);
//     expect(res.body.name).toBe(newStore.name);
//     storeId = res.body.id; // Save the store ID for later tests
// });

describe('Stores', () => {
test('unauthorized user cannot create a store', async () => {
  const newStore = { name: 'Downtown Store' };

  const res = await request(app)
    .post(`/api/franchise/${franchiseId}/store`)
    .set('Authorization', `Bearer ${franchiseeUserAuthToken}`)
    .send(newStore);

  expect(res.status).toBe(403);
  expect(res.body.message).toBe('unable to create a store');
});

// DELETE /api/franchise/:franchiseId/store/:storeId
test('admin deletes a store', async () => {
  const res = await request(app)
    .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
    .set('Authorization', `Bearer ${adminUserAuthToken}`);

  expect(res.status).toBe(200);
  expect(res.body.message).toBe('store deleted');
});

test('unauthorized user cannot delete a store', async () => {
  const res = await request(app)
    .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
    .set('Authorization', `Bearer ${franchiseeUserAuthToken}`);

  expect(res.status).toBe(403);
  expect(res.body.message).toBe('unable to delete a store');
});

});