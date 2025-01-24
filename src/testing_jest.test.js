test('Basic Maths', () => {
    expect(1+1).toEqual(2); // 
    expect(2*2).toBe(4); // tobe is used for strict equality aka ===
    expect(3-1).not.toBe(4);
    expect(4).toBeGreaterThan(3);
    expect(10).toBeGreaterThanOrEqual(10);
    expect(5).toBeLessThan(6);
    expect(5).toBeLessThanOrEqual(5);
    expect(.00000001).toBeCloseTo(0);
});

test('Truthy and Falsy', () => {
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect(0).toBeFalsy();
    expect(1).toBeTruthy();
});

test('Regex', () => {
    const body = JSON.stringify({ date: '20240202T00:00:10Z', name: 'orem' });
    expect(body).toMatch(/{"date":".*","name":"orem"}/);
});

test('arrays objects', () => {
    expect('abcd').toContain('bc');
    expect([1, 2, 3]).toContain(2);
    expect([1, 2, 3]).toEqual(expect.arrayContaining([2, 3]));
    expect({ id: 2, cost: 3 }).toHaveProperty('cost', 3);
    expect({ id: 2, cost: 3 }).toEqual(expect.objectContaining({ id: 2 }));
    expect({ id: 2, cost: 3 }).toMatchObject({ id: 2 });
  });

test('exceptions', () => {
    expect(() => {
        throw new Error('error');
    }).toThrow();
    expect(() => {}).not.toThrow();
});

test('mocking functions', () => {
    const mockFn = jest.fn((p) => `${p}`);
  
    mockFn(1);
    mockFn(2);
  
    expect(mockFn.mock.calls[0][0]).toBe(1);
    expect(mockFn.mock.results[0].value).toBe('1');
  
    expect(mockFn.mock.calls[1][0]).toBe(2);
    expect(mockFn.mock.results[1].value).toBe('2');

    expect(mockFn(1)).toBe('1');
    expect(mockFn(2)).toBe('2');

    expect(mockFn).toHaveBeenCalledWith(1);
    expect(mockFn).toHaveBeenLastCalledWith(2);
  });

  test('mocking function multiple calls', () => {
    const mockFn = jest.fn();
  
    // Set the default return value to 42
    mockFn.mockReturnValue(42);
    expect(mockFn()).toBe(42);
  
    // Override the default for the next two calls to 1 and 2
    mockFn.mockReturnValueOnce(1).mockReturnValueOnce(2);
    expect(mockFn()).toBe(1);
    expect(mockFn()).toBe(2);
  
    // Next call is back to the default
    expect(mockFn()).toBe(42);
  });

  class Pipeline {
    constructor() {
      this.steps = [];
    }
  
    add(step) {
      this.steps.push(step);
      return this;
    }
  
    run(data) {
      return this.steps.reduce((result, step) => step(result), data);
    }
  }
  
  test('mocking callback functions', () => {
    const mockStep = jest.fn();
  
    new Pipeline().add(mockStep).add(mockStep).run('data');
  
    expect(mockStep).toHaveBeenCalledTimes(2);
    expect(mockStep.mock.calls).toEqual([['data'], [undefined]]);
  });


test('mocking promises', async () => {
  const mockFn = jest.fn().mockResolvedValue(42);

  const result = await mockFn();
  expect(result).toBe(42);
});

test('fake timers', async () => {
    jest.useFakeTimers({ now: 0 });
    expect(Date.now()).toBe(0);
  
    jest.advanceTimersByTime(1000);
    expect(Date.now()).toBe(1000);
  
    // Still 1000 even after waiting
    const timeoutMock = jest.fn();
    setTimeout(() => {
      timeoutMock();
    }, 1000);
    expect(timeoutMock).not.toHaveBeenCalled();
    expect(Date.now()).toBe(1000);
  
    jest.advanceTimersByTime(2000);
    expect(timeoutMock).toHaveBeenCalled();
    expect(Date.now()).toBe(3000);
  
    jest.useRealTimers();
  });

  test('async fake timers', async () => {
    jest.useFakeTimers({ now: 0 });
  
    const timerMock = jest.fn();
  
    setInterval(async () => {
      timerMock(Date.now());
    }, 1000);
  
    await jest.advanceTimersByTimeAsync(1000);
    expect(timerMock).toHaveBeenCalledTimes(1);
  
    await jest.advanceTimersByTimeAsync(1000);
    expect(timerMock).toHaveBeenCalledTimes(2);
  
    jest.useRealTimers();
  });

  test('fetches data', async () => {
    global.fetch = jest.fn((url) =>
      Promise.resolve({
        json: () => {
          switch (url) {
            case 'https://one.com':
              return Promise.resolve({ data: 'one data' });
            case 'https://two.com':
              return Promise.resolve({ data: 'two data' });
            default:
              return Promise.resolve({ data: 'default data' });
          }
        },
      })
    );
  
    const response = await fetch('https://two.com');
    const data = await response.json();
    expect(data).toEqual({ data: 'two data' });
    expect(fetch).toHaveBeenCalledWith('https://two.com');
  });