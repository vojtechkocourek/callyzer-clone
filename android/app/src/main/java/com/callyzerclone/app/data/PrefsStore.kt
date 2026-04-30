package com.callyzerclone.app.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "callyzer_prefs")

class PrefsStore(private val context: Context) {
    companion object {
        private val KEY_TOKEN = stringPreferencesKey("token")
        private val KEY_USER_ID = stringPreferencesKey("user_id")
        private val KEY_USER_NAME = stringPreferencesKey("user_name")
        private val KEY_BASE_URL = stringPreferencesKey("base_url")
        private val KEY_LAST_SYNC = longPreferencesKey("last_sync_ms")
    }

    val baseUrlFlow: Flow<String> = context.dataStore.data.map {
        it[KEY_BASE_URL] ?: ""
    }
    val tokenFlow: Flow<String?> = context.dataStore.data.map { it[KEY_TOKEN] }
    val userNameFlow: Flow<String?> = context.dataStore.data.map { it[KEY_USER_NAME] }
    val lastSyncFlow: Flow<Long> = context.dataStore.data.map { it[KEY_LAST_SYNC] ?: 0L }

    suspend fun token(): String? = context.dataStore.data.first()[KEY_TOKEN]
    suspend fun baseUrl(): String =
        context.dataStore.data.first()[KEY_BASE_URL] ?: ""

    suspend fun saveSession(token: String, userId: String, userName: String) {
        context.dataStore.edit {
            it[KEY_TOKEN] = token
            it[KEY_USER_ID] = userId
            it[KEY_USER_NAME] = userName
        }
    }

    suspend fun saveBaseUrl(url: String) {
        context.dataStore.edit { it[KEY_BASE_URL] = url }
    }

    suspend fun setLastSync(ts: Long) {
        context.dataStore.edit { it[KEY_LAST_SYNC] = ts }
    }

    suspend fun clearSession() {
        context.dataStore.edit {
            it.remove(KEY_TOKEN)
            it.remove(KEY_USER_ID)
            it.remove(KEY_USER_NAME)
        }
    }
}
