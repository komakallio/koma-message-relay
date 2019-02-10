const redis = require('redis');
const zmq = require('zeromq');
const config = require('./config');

const redisSubscriber = redis.createClient();
redisSubscriber.config('set', 'notify-keyspace-events', 'Ez');
redisSubscriber.on('error', err => console.log(`${err}`));

const pubSocket = zmq.socket('pub');
pubSocket.connect(config.BROKER_ADDRESS);

const redisClient = redisSubscriber.duplicate();
const messageHandler = (_, topic) => {
  redisClient.zrevrange(topic, 0, 0, 'withscores', (err, response) => {
    if (err) throw err;
    const [value, score] = response;
    const message = `${topic} ${score} ${value}`;
    pubSocket.send(message);
  });
};

redisSubscriber.subscribe('__keyevent@0__:zadd');
redisSubscriber.on('message', messageHandler);

/* Test message sender */
if (config.TEST_MODE) {
  const testPublisher = redisSubscriber.duplicate();
  const sendMessages = () => {
    testPublisher.zadd('ptu', Date.now(), '{"data": "this is fake news"}');
    setTimeout(sendMessages, 2000);
  };

  setTimeout(sendMessages, 2000);
}
