const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

// Load all three proto files
const patientProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(__dirname, '../../proto/patient.proto'), options)
).patient;

const appointmentProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(__dirname, '../../proto/appointment.proto'), options)
).appointment;

const notificationProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(__dirname, '../../proto/notification.proto'), options)
).notification;

// Create gRPC clients pointing to each service's Docker network address
const patientClient = new patientProto.PatientService(
  process.env.PATIENT_SERVICE_URL || 'localhost:50051',
  grpc.credentials.createInsecure()
);

const appointmentClient = new appointmentProto.AppointmentService(
  process.env.APPOINTMENT_SERVICE_URL || 'localhost:50052',
  grpc.credentials.createInsecure()
);

const notificationClient = new notificationProto.NotificationService(
  process.env.NOTIFICATION_SERVICE_URL || 'localhost:50053',
  grpc.credentials.createInsecure()
);

// Helper: wrap gRPC callback style into a Promise
function grpcCall(client, method, request) {
  return new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

module.exports = { patientClient, appointmentClient, notificationClient, grpcCall };