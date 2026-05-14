const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { publishAppointmentCreated, publishAppointmentCancelled } = require('./kafkaProducer');

const PROTO_PATH = path.join(__dirname, '../../proto/appointment.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef).appointment;

function createAppointment(call, callback) {
  try {
    const { patient_id, doctor_name, date, time, reason } = call.request;
    const id = uuidv4();
    const status = 'scheduled';

    db.prepare(
      'INSERT INTO appointments (id, patient_id, doctor_name, date, time, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, patient_id, doctor_name, date, time, reason, status);

    const appointment = { id, patient_id, doctor_name, date, time, reason, status };

    publishAppointmentCreated(appointment).catch(console.error);

    callback(null, appointment);
  } catch (err) {
    console.error('[createAppointment] Error:', err.message);
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

function getAppointment(call, callback) {
  try {
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(call.request.id);
    if (!appt) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Appointment not found' });
    }
    callback(null, appt);
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

function listAppointments(call, callback) {
  try {
    const { patient_id } = call.request;
    let appointments;
    if (patient_id) {
      appointments = db.prepare('SELECT * FROM appointments WHERE patient_id = ?').all(patient_id);
    } else {
      appointments = db.prepare('SELECT * FROM appointments').all();
    }
    callback(null, { appointments });
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

function cancelAppointment(call, callback) {
  try {
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(call.request.id);
    if (!appt) {
      return callback({ code: grpc.status.NOT_FOUND, message: 'Appointment not found' });
    }
    db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(call.request.id);

    publishAppointmentCancelled({ ...appt, status: 'cancelled' }).catch(console.error);

    callback(null, { success: true, message: 'Appointment cancelled' });
  } catch (err) {
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
}

const server = new grpc.Server();
server.addService(proto.AppointmentService.service, {
  createAppointment,
  getAppointment,
  listAppointments,
  cancelAppointment,
});

const PORT = process.env.GRPC_PORT || 50052;
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) { console.error('[gRPC] Failed to bind:', err); process.exit(1); }
    console.log(`[Appointment Service] gRPC server running on port ${port}`);
  }
);