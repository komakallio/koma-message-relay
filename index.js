/* eslint-disable no-console */
const redis = require('redis');

const redisClient = redis.createClient();

redisClient.config('set', 'notify-keyspace-events', 'KEA');

redisClient.on('error', err => console.log(`${err}`));

redisClient.psubscribe(['__keyevent@0__:*', '__keyspace@0__:*']);
redisClient
  .on('pmessage', (pattern, channel, message) => console.log(`${channel}: ${message}, matching pattern ${pattern}`));
