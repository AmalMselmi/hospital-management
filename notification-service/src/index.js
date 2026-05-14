const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { getDb } = require('./db');
const { startConsumer } = require('./kafkaConsumer');

const PROTO_PATH = path.join(__dirname, '../../proto/notification.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef).notification;

async function listNotifications(call, callback) {
  try {
    const db = await getDb();
    const { patient_id } = call.request;

    let query;
    if (patient_id) {
      query = db.notifications.find({ selector: { patient_id: { $eq: patient_id } } });
    } else {
      query = db.notifications.find();
    }

    const docs = await query.exec();
    const notifications = docs.map(d => d.toJSON());
    callback(null, { notifications });
  } catch (err) {
    console.error('[listNotifications] Error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

async function startServer() {
  // Start Kafka consumer first
  await startConsumer();

  const server = new grpc.Server();
  server.addService(proto.NotificationService.service, { listNotifications });

  const PORT = process.env.GRPC_PORT || 50053;
  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) { console.error('[gRPC] Failed to bind:', err); process.exit(1); }
      console.log(`[Notification Service] gRPC server running on port ${port}`);
    }
  );
}

startServer().catch(err => {
  console.error('[Notification Service] Fatal error:', err);
  process.exit(1);
});