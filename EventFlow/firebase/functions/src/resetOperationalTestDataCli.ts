import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { FieldPath, getFirestore } from 'firebase-admin/firestore'
import { parseResetOptions, RESET_BATCH_SIZE, RESET_COLLECTIONS, RESET_DRY_RUN_ID_LIMIT, validateResetOptions } from './resetOperationalTestData'

const options = parseResetOptions(process.argv.slice(2))
validateResetOptions(options)
initializeApp({ credential: applicationDefault(), projectId: options.projectId })
const db = getFirestore()

async function inspectCollection(name: string) {
  const snapshot = await db.collection(name).orderBy(FieldPath.documentId()).get()
  return { name, count: snapshot.size, ids: snapshot.docs.slice(0, RESET_DRY_RUN_ID_LIMIT).map((item) => item.id), omittedIdCount: Math.max(0, snapshot.size - RESET_DRY_RUN_ID_LIMIT) }
}

async function deleteCollection(name: string) {
  let deleted = 0
  while (true) {
    const snapshot = await db.collection(name).orderBy(FieldPath.documentId()).limit(RESET_BATCH_SIZE).get()
    if (snapshot.empty) return deleted
    const batch = db.batch()
    snapshot.docs.forEach((item) => batch.delete(item.ref))
    await batch.commit()
    deleted += snapshot.size
    console.log(JSON.stringify({ collection: name, batchDeleted: snapshot.size, totalDeleted: deleted }))
  }
}

async function main() {
  const report = await Promise.all(RESET_COLLECTIONS.map(inspectCollection))
  console.log(JSON.stringify({ mode: options.apply ? 'apply' : 'dry-run', projectId: options.projectId, irreversibleWithoutBackup: true, preservedCollections: ['users', 'students', 'staff', 'vehicles', 'activities', 'eventTypes', 'settings'], collections: report }, null, 2))
  if (!options.apply) {
    console.log('Dry run only. No documents were deleted. Obtain Product Owner approval before apply.')
    return
  }
  const results: Array<{ collection: string; deleted: number; error?: string }> = []
  for (const collection of RESET_COLLECTIONS) {
    try { results.push({ collection, deleted: await deleteCollection(collection) }) }
    catch (reason) { results.push({ collection, deleted: 0, error: reason instanceof Error ? reason.message : String(reason) }); console.error(JSON.stringify({ applyResults: results }, null, 2)); throw reason }
  }
  console.log(JSON.stringify({ applyResults: results }, null, 2))
}

main().catch((reason) => { console.error(reason); process.exitCode = 1 })
