/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
|
| The "server.ts" file is the entrypoint for starting the AdonisJS HTTP
| server. Either you can run this file directly or use the "serve"
| command to run this file and monitor file changes
|
*/

import 'reflect-metadata'

import { Ignitor, prettyPrintError } from '@adonisjs/core'

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
  .httpServer()
  .start()
  .catch((error) => {
    process.exitCode = 1
    void prettyPrintError(error)
  })
