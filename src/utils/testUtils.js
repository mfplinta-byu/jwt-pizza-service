function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

function createUser() {
  return { name: 'pizza diner', email: Math.random().toString(36).substring(2, 12) + '@test.com', password: 'a' };
}

module.exports = { expectValidJwt, createUser }