import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { FieldPath, getFirestore } from 'firebase-admin/firestore'
import { classifyDependentEventIds, parseResetOptions, PRESERVED_COLLECTIONS, RESET_BATCH_SIZE, RESET_COLLECTIONS, RESET_DEPENDENT_COLLECTIONS, RESET_DRY_RUN_ID_LIMIT, validateResetOptions } from './resetOperationalTestData'

const options = parseResetOptions(process.argv.slice(2))
validateResetOptions(options)
initializeApp({ credential: applicationDefault(), projectId: options.projectId })
const db = getFirestore()

async function inspectCollection(name: string) {
  const snapshot = await db.collection(name).orderBy(FieldPath.documentId()).get()
  return { name, count: snapshot.size, ids: snapshot.docs.slice(0, RESET_DRY_RUN_ID_LIMIT).map((item) => item.id), omittedIdCount: Math.max(0, snapshot.size - RESET_DRY_RUN_ID_LIMIT), snapshot }
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
  const [inspectedReset, inspectedPreserved] = await Promise.all([
    Promise.all(RESET_COLLECTIONS.map(inspectCollection)),
    Promise.all(PRESERVED_COLLECTIONS.map(inspectCollection)),
  ])
  const eventIds = new Set(inspectedReset.find((item) => item.name === 'events')?.snapshot.docs.map((item) => item.id) ?? [])
  const anomalies = RESET_DEPENDENT_COLLECTIONS.map((name) => {
    const collection = inspectedReset.find((item) => item.name === name)
    return { collection: name, ...classifyDependentEventIds(eventIds, collection?.snapshot.docs.map((item) => item.data().eventId) ?? []) }
  })
  const collections = inspectedReset.map(({ snapshot: _snapshot, ...item }) => item)
  const preservedCollections = inspectedPreserved.map(({ snapshot: _snapshot, ids: _ids, omittedIdCount: _omittedIdCount, ...item }) => item)
  console.log(JSON.stringify({ mode: options.apply ? 'apply' : 'dry-run', projectId: options.projectId, irreversibleWithoutBackup: true, preservedCollections, collections, anomalies }, null, 2))
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
