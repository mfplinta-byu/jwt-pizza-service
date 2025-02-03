const request = require('supertest');
const app = require('../service');


const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
const userToUpdate = { name: 'pizza diner to update', email: 'reg@test.com', password: 'a', roles: [{ role: 'admin' }] }; 
let testUserAuthToken;
let userToUpdateAuthToken;

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

beforeAll(async () => {
  testUser.email = randomName() + '@test.com';
//   testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  expectValidJwt(testUserAuthToken);

  // const registerRes2 = await request(app).post('/api/auth').send(userToUpdate);
  // userToUpdateAuthToken = registerRes2.body.token;
  // expectValidJwt(userToUpdateAuthToken);
});

// **Consern, app allows multiple registrations of the same email?
// test('Negative register', async () => {
//     const registerRes = await request(app).post('/api/auth').send(testUser);
//     expect(registerRes.status).toBe(200);
//     // expect(registerRes.body.message).toBeUndefined();
//     const registerRes2 = await request(app).post('/api/auth').send(testUser);
//     expect(registerRes2.status).toBe(400);
    
// });

describe('Login and logout', () => {
test('login existing user', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);
  
  const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

test('login with incorrect credentials should fail', async () => {
  const wrongUser = { email: testUser.email, password: 'wrongpassword' };
  const loginRes = await request(app).put('/api/auth').send(wrongUser);
  
  expect(loginRes.status).toBe(404);
  expect(loginRes.body.message).toBe('unknown user');
});

test('logout user', async () => {
  const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
  
  expect(logoutRes.status).toBe(200);
  expect(logoutRes.body.message).toBe('logout successful');
  
  // Try to use the token after logout
  const protectedRes = await request(app).put('/api/auth/1').set('Authorization', `Bearer ${testUserAuthToken}`);
  expect(protectedRes.status).toBe(401);
});

});
test('register new user', async () => {
  const newUser = { name: 'pizza diner tester', email: randomName() + '@test.com', password: 'a' };
  const registerRes = await request(app).post('/api/auth').send(newUser);
  
  expect(registerRes.status).toBe(200);
  expectValidJwt(registerRes.body.token);
  
  const expectedUser = { ...newUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(registerRes.body.user).toMatchObject(expectedUser);
});

// test('update user', async () => {
//   const loginRes = await request(app).put('/api/auth').send(userToUpdate);
//   expect(loginRes.status).toBe(200);
//   expectValidJwt(loginRes.body.token);

//   console.log('Logged in user:', loginRes.body.user);
//   console.log('Auth token:', loginRes.body.token);

//   const updatedUser = { email: 'newemail@test.com'};
//   //   const updatedUser = { email: 'newemail@test.com', password: 'newpassword' };

//   const updateRes = await request(app)
//     .put(`/api/auth/${userToUpdate.id}`)
//     .set('Authorization', `Bearer ${userToUpdateAuthToken}`)
//     .send(updatedUser);

//   console.log('Update response:', updateRes.body);
//   console.log('Update status:', updateRes.status);

//   expect(updateRes.status).toBe(200);
//   expect(updateRes.body.email).toBe(updatedUser.email);
// });

test('non-admin user cannot update another user', async () => {
  // Attempt to update another user's information using the non-admin user's token
  const updatedUser = { email: 'updated@test.com', password: 'newpassword' };

  const updateRes = await request(app)
    .put(`/api/auth/${userToUpdate.id}`) // Attempt to update another user
    .set('Authorization', `Bearer ${testUserAuthToken}`) // Use the non-admin user's token
    .send(updatedUser);

  // Verify the response
  expect(updateRes.status).toBe(401); // Expect a 403 Forbidden status
  expect(updateRes.body.message).toBe('unauthorized'); // Expect an appropriate error message
});
function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}