# Smart Hospital Management System — Microservices

A production-style microservices application built with Node.js, gRPC, REST, GraphQL, Kafka 4, SQLite3, and RxDB.

## Architecture

- **API Gateway** (port 4000) — REST + GraphQL entry point
- **Patient Service** (gRPC :50051) — Patient CRUD, SQLite3
- **Appointment Service** (gRPC :50052) — Appointment booking, SQLite3
- **Notification Service** (gRPC :50053) — Kafka consumer, RxDB (NoSQL)
- **Kafka Broker** (port 9092) — Event broker, KRaft mode (Kafka 4.0)

## Kafka Topics

| Topic                 | Producer             | Consumer             | Triggered when              |
|-----------------------|----------------------|----------------------|-----------------------------|
| patient.created       | Patient Service      | Notification Service | A new patient registers     |
| appointment.created   | Appointment Service  | Notification Service | An appointment is booked    |
| appointment.cancelled | Appointment Service  | Notification Service | An appointment is cancelled |


## Quick Start

```bash
# Clone the repo
git clone https://github.com/<your-org>/hospital-microservices
cd hospital-microservices

# Create required data directories
mkdir -p patient-service/data appointment-service/data

# Start everything
docker-compose up --build
```

## REST API Examples

```bash
# Create a patient
curl -X POST http://localhost:4000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Martin","email":"alice@example.com","phone":"0612345678","age":34}'

# List all patients
curl http://localhost:4000/api/patients

# Book an appointment
curl -X POST http://localhost:4000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"<id>","doctor_name":"Dr. Ben Ali","date":"2026-06-01","time":"10:00","reason":"Checkup"}'

# Cancel an appointment
curl -X DELETE http://localhost:4000/api/appointments/<id>

# View notifications for a patient
curl "http://localhost:4000/api/notifications?patient_id=<id>"
```

## GraphQL Examples

Open http://localhost:4000/graphql in your browser (Apollo Sandbox).

```graphql
# Create a patient
mutation {
  createPatient(name: "Bob Dupont", email: "bob@example.com", phone: "0698765432", age: 45) {
    id
    name
    email
  }
}

# Query only the fields you need (GraphQL strength)
query {
  appointments(patient_id: "<id>") {
    id
    doctor_name
    date
    status
  }
}

# Check notifications
query {
  notifications(patient_id: "<id>") {
    message
    type
    created_at
  }
}
```