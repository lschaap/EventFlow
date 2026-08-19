export const RESET_PROJECT_ID = 'eventflow-612ed'
export const RESET_CONFIRMATION = 'DELETE_EVENT_OPERATIONAL_TEST_DATA'
export const RESET_COLLECTIONS = ['events', 'eventParticipants', 'eventStaffParticipants', 'eventDrivers', 'eventVehicleTrips'] as const
export const RESET_DEPENDENT_COLLECTIONS = ['eventParticipants', 'eventStaffParticipants', 'eventDrivers', 'eventVehicleTrips'] as const
export const PRESERVED_COLLECTIONS = ['users', 'approvedUsers', 'students', 'staff', 'vehicles', 'activities', 'eventTypes', 'settings'] as const
export const RESET_BATCH_SIZE = 400
export const RESET_DRY_RUN_ID_LIMIT = 100

export interface ResetOptions { projectId: string; apply: boolean; confirmation?: string; acknowledgedDisposableData: boolean }

export function classifyDependentEventIds(eventIds: ReadonlySet<string>, values: unknown[]) {
  let orphaned = 0
  let malformed = 0
  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) malformed += 1
    else if (!eventIds.has(value)) orphaned += 1
  }
  return { orphaned, malformed }
}

export function parseResetOptions(argv: string[]): ResetOptions {
  const projectId = argv.find((value) => value.startsWith('--project='))?.slice('--project='.length) ?? ''
  return {
    projectId,
    apply: argv.includes('--apply'),
    confirmation: argv.find((value) => value.startsWith('--confirm='))?.slice('--confirm='.length),
    acknowledgedDisposableData: argv.includes('--ack-disposable-data'),
  }
}

export function validateResetOptions(options: ResetOptions) {
  if (!options.projectId) throw new Error('Provide --project=eventflow-612ed.')
  if (options.projectId !== RESET_PROJECT_ID) throw new Error(`Reset refused: expected project ${RESET_PROJECT_ID}, received ${options.projectId}.`)
  if (!options.apply) return
  if (!options.acknowledgedDisposableData) throw new Error('Apply requires --ack-disposable-data after backup/export or explicit acknowledgement that operational data is disposable.')
  if (options.confirmation !== RESET_CONFIRMATION) throw new Error(`Apply requires --confirm=${RESET_CONFIRMATION}.`)
}
