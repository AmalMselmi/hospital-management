const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'appointment-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: { initialRetryTime: 300, retries: 10 },
});

const producer = kafka.producer();
let connected = false;

async function connectProducer() {
  if (!connected) {
    await producer.connect();
    connected = true;
    console.log('[Kafka] Appointment service producer connected');
  }
}

async function publishAppointmentCreated(appointment) {
  await connectProducer();
  await producer.send({
    topic: 'appointment.created',
    messages: [
      {
        key: appointment.id,
        value: JSON.stringify({
          event: 'APPOINTMENT_CREATED',
          timestamp: new Date().toISOString(),
          data: appointment,
        }),
      },
    ],
  });
  console.log(`[Kafka] Published appointment.created for ${appointment.id}`);
}

async function publishAppointmentCancelled(appointment) {
  await connectProducer();
  await producer.send({
    topic: 'appointment.cancelled',
    messages: [
      {
        key: appointment.id,
        value: JSON.stringify({
          event: 'APPOINTMENT_CANCELLED',
          timestamp: new Date().toISOString(),
          data: appointment,
        }),
      },
    ],
  });
  console.log(`[Kafka] Published appointment.cancelled for ${appointment.id}`);
}

module.exports = { publishAppointmentCreated, publishAppointmentCancelled };