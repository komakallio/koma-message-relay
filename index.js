const redis = require('redis');
const zmq = require('zeromq');
const config = require('./config');

/* Config Redis event subscriber */
const redisSubscriber = redis.createClient(config.REDIS_PORT, config.REDIS_HOST);
redisSubscriber.config('set', 'notify-keyspace-events', 'Ez');
redisSubscriber.on('error', err => console.log(`${err}`));

/* Connect ZeroMQ to message broker */
const pubSocket = zmq.socket('pub');
pubSocket.connect(config.BROKER_ADDRESS);

/* A Redis client cannot be in Subscribe mode and make queries
  at the same time, must make another Redis client */
const redisClient = redisSubscriber.duplicate();
const messageHandler = (_, topic) => {
  redisClient.zrevrange(topic, 0, 0, 'withscores', (err, response) => {
    if (err) throw err;
    const [value, score] = response;
    const message = `${topic} ${score} ${value}`;
    pubSocket.send(message);
  });
};

/* Subscribe to key event notifications */
redisSubscriber.subscribe('__keyevent@0__:zadd');
redisSubscriber.on('message', messageHandler);

/* Test message sender */
if (config.TEST_MODE) {
  const testPublisher = redisSubscriber.duplicate();
  const sendMessages = () => {
    testPublisher.zadd('fake', Date.now(), '{"data": "this is fake news"}');
    setTimeout(sendMessages, 2000);
  };

  setTimeout(sendMessages, 2000);
}
