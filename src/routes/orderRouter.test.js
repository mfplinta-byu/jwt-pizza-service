const request = require('supertest');
const app = require('../service');
const utils = require('../utils/testUtils');

let adminUserAuthToken;
let dinerUser = utils.createUser();
let testMenuItems = [
  { title: utils.randomText(5), description: "Test item", image:"pizza9.png", price: 0.0001 },
  { title: utils.randomText(5), description: "Test item", image:"pizza9.png", price: 0.0001 },
  { title: utils.randomText(5), description: "Test item", image:"pizza9.png", price: 0.0001 },
  { title: utils.randomText(5), description: "Test item", image:"pizza9.png", price: 0.0001 }
];
let testFranchise = {name: utils.randomText(5), admins: [{email: utils.adminUser.email}]};
let testStore;

beforeAll(async () => {
  // Fix race condition on login
  jest.useFakeTimers({ advanceTimers: true });
  jest.advanceTimersByTime(10000);
  // Login admin user
  const loginAdminRes = await request(app).put('/api/auth').send(utils.adminUser);
  expect(loginAdminRes.status).toBe(200);
  adminUserAuthToken = loginAdminRes.body.token;
  utils.expectValidJwt(adminUserAuthToken);

  // Create utility users
  let dinerUserRes = await request(app).post('/api/auth').send(dinerUser);
  expect(dinerUserRes.status).toBe(200);
  dinerUser = {...dinerUser, token: dinerUserRes.body.token};

  // Create some menu items
  for(const testItem of testMenuItems) {
    const addItemRes = await request(app)
    .put('/api/order/menu')
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send(testItem);
    expect(addItemRes.status).toBe(200);
  }

  // Create a franchise
  const createFranchiseRes = await request(app)
    .post('/api/franchise')
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send(testFranchise);
    expect(createFranchiseRes.status).toBe(200);
  testFranchise = {...testFranchise, id: createFranchiseRes.body.id};

  // Create a store in franchise
  testStore = {franchiseId: testFranchise.id, name: utils.randomText(5)};
  const createStoreRes = await request(app)
    .post(`/api/franchise/${testFranchise.id}/store`)
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send(testStore)
  expect(createStoreRes.status).toBe(200);
  testStore = {...testStore, id: createStoreRes.body.id};
});

test('get menu items', async () => {
  const getMenuRes = await request(app).get('/api/order/menu');
  expect(getMenuRes.status).toBe(200);

  for(const testItem of testMenuItems) {
    expect(getMenuRes.body.some(item => item.title === testItem.title)).toBe(true);
  }
});

test('add item to menu success', async () => {
  const addItemRes = await request(app)
    .put('/api/order/menu')
    .set('Authorization', 'Bearer ' + adminUserAuthToken)
    .send({ title: utils.randomText(5), description: "Test item", image:"pizza9.png", price: 0.0001 });
  expect(addItemRes.status).toBe(200);
});

test('add item to menu unauthorized', async () => {
  const addItemRes = await request(app)
    .put('/api/order/menu')
    .set('Authorization', 'Bearer ' + dinerUser.token)
    .send({ title: utils.randomText(5), description: "Test item", image:"pizza9.png", price: 0.0001 });
  expect(addItemRes.status).toBe(403);
});

test('create order for user', async () => {
  const getMenuRes = await request(app).get('/api/order/menu');
  expect(getMenuRes.status).toBe(200);

  const testItem = getMenuRes.body[0];
  const createOrderRes = await request(app)
    .post('/api/order')
    .set('Authorization', 'Bearer ' + dinerUser.token)
    .send({
      franchiseId: testFranchise.id,
      storeId: testStore.id,
      items: [
        {menuId: testItem.id, description: testItem.description, price: testItem.price}
      ]
    });
  expect(createOrderRes.status).toBe(200);
});

test('get orders for user', async () => {
  // Creating test order
  const getMenuRes = await request(app).get('/api/order/menu');
  expect(getMenuRes.status).toBe(200);

  const testItem = getMenuRes.body[0];
  let testOrderId;
  const createOrderRes = await request(app)
    .post('/api/order')
    .set('Authorization', 'Bearer ' + dinerUser.token)
    .send({
      franchiseId: testFranchise.id,
      storeId: testStore.id,
      items: [
        {menuId: testItem.id, description: testItem.description, price: testItem.price}
      ]
    });
  expect(createOrderRes.status).toBe(200);
  testOrderId = createOrderRes.body.order.id;

  // Getting test order back
  const getOrdersRes = await request(app)
  .get('/api/order')
  .set('Authorization', 'Bearer ' + dinerUser.token);
  expect(getOrdersRes.status).toBe(200);
  expect(getOrdersRes.body.orders.some(order => order.id === testOrderId)).toBe(true);
});

afterAll(async () => {
  jest.useRealTimers();
  // No cleanup possible
});