const adminUser = { name: "a", email: "a@jwt.org", password: "a" };

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

function createUser() {
  return { name: 'pizza diner', email: randomText(10) + '@test.com', password: 'a' };
}

function randomText(length) {
  return Math.random().toString(36).substring(2, 2 + length);
}

module.exports = { adminUser, expectValidJwt, createUser, randomText }