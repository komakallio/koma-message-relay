const redis = require('redis');
const mqtt = require('mqtt');
const config = require('./config');

/* Config Redis event subscriber */
const redisSubscriber = redis.createClient(config.REDIS_PORT, config.REDIS_HOST);
redisSubscriber.config('set', 'notify-keyspace-events', 'Ez');
redisSubscriber.on('error', err => console.log(`${err}`));

/* Connect to MQTT message broker */
const mqttClient = mqtt.connect(config.BROKER_ADDRESS, {
  username: config.BROKER_USERNAME,
  password: config.BROKER_PASSWORD,
});

/* A Redis client cannot be in Subscribe mode and make queries
  at the same time, must make another Redis client */
const redisClient = redisSubscriber.duplicate();
const messageHandler = (_, topic) => {
  redisClient.zrevrange(topic, 0, 0, 'withscores', (err, response) => {
    if (err) throw err;
    const message = response[0];
    mqttClient.publish(topic, message);
  });
};

/* Subscribe to key event notifications */
redisSubscriber.subscribe('__keyevent@0__:zadd');
redisSubscriber.on('message', messageHandler);
