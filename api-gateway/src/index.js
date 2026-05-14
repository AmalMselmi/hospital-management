const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');
const { patientClient, appointmentClient, notificationClient, grpcCall } = require('./grpcClients');

const app = express();
app.use(bodyParser.json());

// ─── REST Endpoints (Patient Service) ─────────────────────────────────────────

// Create a patient
app.post('/api/patients', async (req, res) => {
  try {
    const patient = await grpcCall(patientClient, 'createPatient', req.body);
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a patient by ID
app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await grpcCall(patientClient, 'getPatient', { id: req.params.id });
    res.json(patient);
  } catch (err) {
    if (err.code === 5) return res.status(404).json({ error: 'Patient not found' });
    res.status(500).json({ error: err.message });
  }
});

// List all patients
app.get('/api/patients', async (req, res) => {
  try {
    const response = await grpcCall(patientClient, 'listPatients', {});
    res.json(response.patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a patient
app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = await grpcCall(patientClient, 'updatePatient', { id: req.params.id, ...req.body });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a patient
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const result = await grpcCall(patientClient, 'deletePatient', { id: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── REST Endpoints (Appointment Service) ─────────────────────────────────────

app.post('/api/appointments', async (req, res) => {
  try {
    const appt = await grpcCall(appointmentClient, 'createAppointment', req.body);
    res.status(201).json(appt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments/:id', async (req, res) => {
  try {
    const appt = await grpcCall(appointmentClient, 'getAppointment', { id: req.params.id });
    res.json(appt);
  } catch (err) {
    if (err.code === 5) return res.status(404).json({ error: 'Appointment not found' });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const response = await grpcCall(appointmentClient, 'listAppointments', { patient_id: req.query.patient_id || '' });
    res.json(response.appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const result = await grpcCall(appointmentClient, 'cancelAppointment', { id: req.params.id });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── REST Endpoint (Notification Service) ─────────────────────────────────────

app.get('/api/notifications', async (req, res) => {
  try {
    const response = await grpcCall(notificationClient, 'listNotifications', { patient_id: req.query.patient_id || '' });
    res.json(response.notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// ─── GraphQL via Apollo Server ─────────────────────────────────────────────────

async function startServer() {
  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();

  // Mount GraphQL at /graphql — accessible via Apollo Sandbox in the browser
  app.use('/graphql', expressMiddleware(apollo, {
    context: async ({ req }) => ({ req }),
  }));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`[API Gateway] HTTP server running on port ${PORT}`);
    console.log(`[API Gateway] REST: http://localhost:${PORT}/api/`);
    console.log(`[API Gateway] GraphQL: http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(err => {
  console.error('[API Gateway] Fatal error:', err);
  process.exit(1);
});