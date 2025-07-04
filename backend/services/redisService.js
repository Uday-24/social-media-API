const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: 'redis-stack',
    port: 6379
  }
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Redis connected');
  } catch (err) {
    console.error('❌ Redis connection error:', err);
  }
})();

client.on('error', err => console.error('Redis Error:', err));

module.exports = {
  set: async (key, value, ttlSeconds = 300) => {
    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
  },
  get: async (key) => {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  },
  del: async (key) => {
    await client.del(key);
  }
};
