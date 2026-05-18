const { patientClient, appointmentClient, notificationClient, grpcCall } = require('./grpcClients');

const resolvers = {
  Query: {
    // ── Patient queries ────────────────────────────────────────────────────────
    patient: async (_, { id }) => {
      return await grpcCall(patientClient, 'getPatient', { id });
    },
    patients: async () => {
      const response = await grpcCall(patientClient, 'listPatients', {});
      return response.patients;
    },

    // ── Appointment queries ────────────────────────────────────────────────────
    appointment: async (_, { id }) => {
      return await grpcCall(appointmentClient, 'getAppointment', { id });
    },
    appointments: async (_, { patient_id }) => {
      const response = await grpcCall(appointmentClient, 'listAppointments', { patient_id: patient_id || '' });
      return response.appointments;
    },

    // ── Notification queries ───────────────────────────────────────────────────
    notifications: async (_, { patient_id }) => {
      const response = await grpcCall(notificationClient, 'listNotifications', { patient_id: patient_id || '' });
      return response.notifications;
    },
  },

  Mutation: {
    // ── Patient mutations ──────────────────────────────────────────────────────
    createPatient: async (_, args) => {
      return await grpcCall(patientClient, 'createPatient', args);
    },
    updatePatient: async (_, args) => {
      return await grpcCall(patientClient, 'updatePatient', args);
    },
    deletePatient: async (_, { id }) => {
      return await grpcCall(patientClient, 'deletePatient', { id });
    },

    // ── Appointment mutations ──────────────────────────────────────────────────
    createAppointment: async (_, args) => {
      return await grpcCall(appointmentClient, 'createAppointment', args);
    },
    cancelAppointment: async (_, { id }) => {
      return await grpcCall(appointmentClient, 'cancelAppointment', { id });
    },
    updateAppointment: async (_, args) => {
  return await grpcCall(appointmentClient, 'updateAppointment', args);
},
  },
};

module.exports = { resolvers };