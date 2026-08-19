import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

function sourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((name) => { const path = resolve(root, name); return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : [] })
}

const frontendSource = resolve(__dirname, '../../../frontend/src')
for (const path of sourceFiles(frontendSource)) assert.doesNotMatch(readFileSync(path, 'utf8'), /eventDrivers/, `production frontend must not depend on legacy eventDrivers: ${path}`)
const migration = resolve(__dirname, '../src/migrations/migrateLegacyDrivers.ts')
assert.equal(existsSync(migration), true, 'legacy migration tooling remains available')
assert.match(readFileSync(migration, 'utf8'), /loadCollection<LegacyDriver>\('eventDrivers'/, 'migration tooling still reads legacy eventDrivers')
console.log('legacy eventDrivers isolation tests passed')
