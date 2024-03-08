/*
|--------------------------------------------------------------------------
| Test runner entrypoint
|--------------------------------------------------------------------------
|
| The "test.ts" file is the entrypoint for running tests using Japa.
|
| Either you can run this file directly or use the "test"
| command to run this file and monitor file changes.
|
*/

import 'reflect-metadata'

import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { configure, processCLIArgs, run } from '@japa/runner'

process.env.NODE_ENV = 'test'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = async (filePath: string): Promise<void> => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return await import(new URL(filePath, APP_ROOT).href)
  }
  return await import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', async () => {
      await app.terminate()
    })
    app.listenIf(app.managedByPm2, 'SIGINT', async () => {
      await app.terminate()
    })
  })
  .testRunner()
  .configure(async (app) => {
    const { runnerHooks, ...config } = await import('../tests/bootstrap.js')

    processCLIArgs(process.argv.splice(2))
    configure({
      ...app.rcFile.tests,
      ...config,
      ...{
        setup: runnerHooks.setup,
        teardown: runnerHooks.teardown.concat([
          async () => {
            await app.terminate()
          },
        ]),
      },
    })
  })
  .run(async () => {
    await run()
  })
  .catch((error) => {
    process.exitCode = 1
    void prettyPrintError(error)
  })
