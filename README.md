# Message Relay

Simple message relay that connects to a Redis instance, listens for ZADD key
event notifications and sends the new sorted set data onwards to an external
message broker using MQTT.

Copy example config to a local config file and change any relevant settings:

```
cp config.js.example config.js
vim config.js
```

Start message relay by executing:

```
npm install
npm start
```
