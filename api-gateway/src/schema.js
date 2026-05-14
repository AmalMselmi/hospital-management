const { gql } = require('graphql-tag');

const typeDefs = gql`
  type Patient {
    id: String!
    name: String!
    email: String!
    phone: String!
    age: Int!
  }

  type Appointment {
    id: String!
    patient_id: String!
    doctor_name: String!
    date: String!
    time: String!
    reason: String!
    status: String!
  }

  type Notification {
    id: String!
    patient_id: String!
    message: String!
    type: String!
    created_at: String!
  }

  type DeleteResult {
    success: Boolean!
    message: String!
  }

  type Query {
    # Patient queries
    patient(id: String!): Patient
    patients: [Patient!]!

    # Appointment queries  
    appointment(id: String!): Appointment
    appointments(patient_id: String): [Appointment!]!

    # Notification queries
    notifications(patient_id: String): [Notification!]!
  }

  type Mutation {
    # Patient mutations
    createPatient(name: String!, email: String!, phone: String!, age: Int!): Patient!
    updatePatient(id: String!, name: String!, email: String!, phone: String!, age: Int!): Patient!
    deletePatient(id: String!): DeleteResult!

    # Appointment mutations
    createAppointment(patient_id: String!, doctor_name: String!, date: String!, time: String!, reason: String!): Appointment!
    cancelAppointment(id: String!): DeleteResult!
  }
`;

module.exports = { typeDefs };