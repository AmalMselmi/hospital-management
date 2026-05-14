const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'patient-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

const producer = kafka.producer();
let connected = false;

async function connectProducer() {
  if (!connected) {
    await producer.connect();
    connected = true;
    console.log('[Kafka] Patient service producer connected');
  }
}

async function publishPatientCreated(patient) {
  await connectProducer();
  await producer.send({
    topic: 'patient.created',
    messages: [
      {
        key: patient.id,
        value: JSON.stringify({
          event: 'PATIENT_CREATED',
          timestamp: new Date().toISOString(),
          data: patient,
        }),
      },
    ],
  });
  console.log(`[Kafka] Published patient.created for patient ${patient.id}`);
}

module.exports = { publishPatientCreated };