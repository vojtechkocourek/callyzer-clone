package com.callyzerclone.app.data

import android.content.Context
import android.provider.CallLog
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object CallLogReader {
    /**
     * Reads device call log entries newer than [sinceMs] (Unix millis).
     * Caller must already hold READ_CALL_LOG permission; the function
     * returns an empty list and silently catches SecurityException otherwise.
     */
    fun read(context: Context, sinceMs: Long): List<CallDto> {
        val out = ArrayList<CallDto>()
        val cr = context.contentResolver
        val projection = arrayOf(
            CallLog.Calls.NUMBER,
            CallLog.Calls.CACHED_NAME,
            CallLog.Calls.TYPE,
            CallLog.Calls.DATE,
            CallLog.Calls.DURATION,
        )
        val selection = "${CallLog.Calls.DATE} > ?"
        val selectionArgs = arrayOf(sinceMs.toString())
        val sortOrder = "${CallLog.Calls.DATE} DESC"

        val cursor = try {
            cr.query(
                CallLog.Calls.CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                sortOrder,
            )
        } catch (_: SecurityException) {
            return emptyList()
        } ?: return emptyList()

        cursor.use { c ->
            val iNumber = c.getColumnIndex(CallLog.Calls.NUMBER)
            val iName = c.getColumnIndex(CallLog.Calls.CACHED_NAME)
            val iType = c.getColumnIndex(CallLog.Calls.TYPE)
            val iDate = c.getColumnIndex(CallLog.Calls.DATE)
            val iDuration = c.getColumnIndex(CallLog.Calls.DURATION)
            while (c.moveToNext()) {
                val number = c.getString(iNumber).orEmpty()
                if (number.isBlank()) continue
                val name = c.getString(iName).takeUnless { it.isNullOrBlank() }
                val type = mapType(c.getInt(iType))
                val dateMs = c.getLong(iDate)
                val durationSec = c.getLong(iDuration).toInt()
                out.add(
                    CallDto(
                        phoneNumber = number,
                        contactName = name,
                        type = type,
                        startedAt = isoUtc(dateMs),
                        durationSec = durationSec,
                    ),
                )
            }
        }
        return out
    }

    private fun mapType(code: Int): String = when (code) {
        CallLog.Calls.INCOMING_TYPE -> "incoming"
        CallLog.Calls.OUTGOING_TYPE -> "outgoing"
        CallLog.Calls.MISSED_TYPE -> "missed"
        CallLog.Calls.REJECTED_TYPE -> "rejected"
        CallLog.Calls.BLOCKED_TYPE -> "rejected"
        CallLog.Calls.VOICEMAIL_TYPE -> "incoming"
        else -> "incoming"
    }

    private val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    private fun isoUtc(ms: Long): String = fmt.format(Date(ms))
}
