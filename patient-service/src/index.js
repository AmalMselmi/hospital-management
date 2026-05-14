const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { publishPatientCreated } = require('./kafkaProducer');

// Load the proto file from the shared proto directory
const PROTO_PATH = path.join(__dirname, '../../proto/patient.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef).patient;

// ─── gRPC method implementations ──────────────────────────────────────────────

function createPatient(call, callback) {
  try {
    const { name, email, phone, age } = call.request;
    const id = uuidv4();

    const stmt = db.prepare(
      'INSERT INTO patients (id, name, email, phone, age) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, name, email, phone, age);

    const patient = { id, name, email, phone, age };

    // Publish Kafka event (async — don't block gRPC response)
    publishPatientCreated(patient).catch(console.error);

    callback(null, patient);
  } catch (err) {
    console.error('[createPatient] Error:', err.message);
    callback({
      code: grpc.status.INTERNAL,
      message: err.message,
    });
  }
}

function getPatient(call, callback) {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(call.request.id);
    if (!patient) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Patient not found' });
    }
    callback(null, patient);
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

function listPatients(call, callback) {
  try {
    const patients = db.prepare('SELECT * FROM patients').all();
    callback(null, { patients });
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

function updatePatient(call, callback) {
  try {
    const { id, name, email, phone, age } = call.request;
    const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
    if (!existing) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Patient not found' });
    }
    db.prepare(
      'UPDATE patients SET name = ?, email = ?, phone = ?, age = ? WHERE id = ?'
    ).run(name, email, phone, age, id);
    callback(null, { id, name, email, phone, age });
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

function deletePatient(call, callback) {
  try {
    const result = db.prepare('DELETE FROM patients WHERE id = ?').run(call.request.id);
    if (result.changes === 0) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Patient not found' });
    }
    callback(null, { success: true, message: 'Patient deleted successfully' });
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

// ─── Start gRPC server ────────────────────────────────────────────────────────

const server = new grpc.Server();
server.addService(proto.PatientService.service, {
  createPatient,
  getPatient,
  listPatients,
  updatePatient,
  deletePatient,
});

const PORT = process.env.GRPC_PORT || 50051;
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error('[gRPC] Failed to bind:', err);
      process.exit(1);
    }
    console.log(`[Patient Service] gRPC server running on port ${port}`);
  }
);