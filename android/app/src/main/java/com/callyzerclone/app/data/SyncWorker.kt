package com.callyzerclone.app.data

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class SyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val prefs = PrefsStore(applicationContext)
        val token = prefs.token() ?: return Result.success() // not signed in yet
        val baseUrl = prefs.baseUrl()
        val api = ApiFactory.create(baseUrl)

        val calls = CallLogReader.read(applicationContext, sinceMs = 0L)
        if (calls.isEmpty()) return Result.success()

        return try {
            api.sync(bearer = "Bearer $token", body = SyncRequest(calls))
            prefs.setLastSync(System.currentTimeMillis())
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}
