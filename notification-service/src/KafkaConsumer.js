const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: { initialRetryTime: 500, retries: 10 },
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

async function startConsumer() {
  await consumer.connect();
  console.log('[Kafka] Notification consumer connected');

  await consumer.subscribe({
    topics: ['patient.created', 'appointment.created', 'appointment.cancelled'],
    fromBeginning: false,
  });

  const db = await getDb();

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        const { event, data } = payload;

        let notifMessage = '';
        let notifType = '';
        let patient_id = '';

        if (event === 'PATIENT_CREATED') {
          notifMessage = `Welcome ${data.name}! Your patient record has been successfully created.`;
          notifType = 'patient_welcome';
          patient_id = data.id;
        }
        else if (event === 'APPOINTMENT_CREATED') {
          notifMessage = `Your appointment with Dr. ${data.doctor_name} on ${data.date} at ${data.time} is confirmed.`;
          notifType = 'appointment_created';
          patient_id = data.patient_id;
        }
        else if (event === 'APPOINTMENT_CANCELLED') {
          notifMessage = `Your appointment with Dr. ${data.doctor_name} on ${data.date} has been cancelled.`;
          notifType = 'appointment_cancelled';
          patient_id = data.patient_id;
        }

        if (notifMessage && patient_id) {
          await db.notifications.insert({
            id: uuidv4(),
            patient_id,
            message: notifMessage,
            type: notifType,
            created_at: new Date().toISOString(),
          });
          console.log(`[Kafka] Notification saved — event: ${event}, patient: ${patient_id}`);
        }
      } catch (err) {
        console.error('[Kafka] Error processing message:', err.message);
      }
    },
  });
}

module.exports = { startConsumer };