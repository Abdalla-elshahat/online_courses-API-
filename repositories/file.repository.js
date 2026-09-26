const { client, BUCKET } = require("../config/minio");

const put = (name, buffer, contentType) =>
  client.putObject(BUCKET, name, buffer, buffer.length, { "Content-Type": contentType });

const stat = (name) => client.statObject(BUCKET, name);

const getStream = (name) => client.getObject(BUCKET, name);

const remove = (name) => client.removeObject(BUCKET, name);

module.exports = { put, stat, getStream, remove };
