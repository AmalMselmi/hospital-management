const { createRxDatabase, addRxPlugin } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { RxDBJsonDumpPlugin } = require('rxdb/plugins/json-dump');

addRxPlugin(RxDBJsonDumpPlugin);

const notificationSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:         { type: 'string', maxLength: 100 },
    patient_id: { type: 'string' },
    message:    { type: 'string' },
    type:       { type: 'string' },
    created_at: { type: 'string' },
  },
  required: ['id', 'patient_id', 'message', 'type', 'created_at'],
};

let db = null;

async function getDb() {
  if (!db) {
    db = await createRxDatabase({
      name: 'notificationsdb',
      storage: getRxStorageMemory(),
    });
    await db.addCollections({
      notifications: { schema: notificationSchema },
    });
    console.log('[RxDB] Notification database initialized');
  }
  return db;
}

module.exports = { getDb };