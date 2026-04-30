package com.callyzerclone.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.callyzerclone.app.data.ApiFactory
import com.callyzerclone.app.data.CallLogReader
import com.callyzerclone.app.data.LoginRequest
import com.callyzerclone.app.data.PrefsStore
import com.callyzerclone.app.data.SyncRequest
import com.callyzerclone.app.data.SyncScheduler
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

data class UiState(
    val baseUrl: String = "",
    val email: String = "",
    val password: String = "",
    val token: String? = null,
    val userName: String? = null,
    val lastSync: Long = 0L,
    val message: String? = null,
    val busy: Boolean = false,
)

class AppViewModel(app: Application) : AndroidViewModel(app) {
    private val prefs = PrefsStore(app)

    private val _internal = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _internal.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                prefs.baseUrlFlow,
                prefs.tokenFlow,
                prefs.userNameFlow,
                prefs.lastSyncFlow,
            ) { baseUrl, token, name, lastSync ->
                Quad(baseUrl, token, name, lastSync)
            }.collect { (baseUrl, token, name, lastSync) ->
                _internal.value = _internal.value.copy(
                    baseUrl = baseUrl,
                    token = token,
                    userName = name,
                    lastSync = lastSync,
                )
            }
        }
    }

    fun setEmail(v: String) { _internal.value = _internal.value.copy(email = v) }
    fun setPassword(v: String) { _internal.value = _internal.value.copy(password = v) }
    fun setBaseUrl(v: String) {
        _internal.value = _internal.value.copy(baseUrl = v)
        viewModelScope.launch { prefs.saveBaseUrl(v) }
    }

    fun login() {
        val s = _internal.value
        viewModelScope.launch {
            _internal.value = s.copy(busy = true, message = null)
            try {
                val api = ApiFactory.create(s.baseUrl)
                val resp = api.login(LoginRequest(s.email, s.password))
                prefs.saveSession(resp.token, resp.user.id, resp.user.name)
                SyncScheduler.schedulePeriodic(getApplication())
                _internal.value = _internal.value.copy(busy = false, message = "Signed in as ${resp.user.name}")
            } catch (e: Exception) {
                _internal.value = _internal.value.copy(busy = false, message = "Login failed: ${e.message}")
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            prefs.clearSession()
            SyncScheduler.cancelAll(getApplication())
            _internal.value = _internal.value.copy(message = "Signed out")
        }
    }

    fun syncNow() {
        viewModelScope.launch {
            val s = _internal.value
            val token = s.token ?: return@launch
            _internal.value = s.copy(busy = true, message = null)
            try {
                val api = ApiFactory.create(s.baseUrl)
                val calls = CallLogReader.read(getApplication(), sinceMs = 0L)
                val resp = api.sync("Bearer $token", SyncRequest(calls))
                prefs.setLastSync(System.currentTimeMillis())
                _internal.value = _internal.value.copy(
                    busy = false,
                    message = "Synced — added ${resp.added}, skipped ${resp.skipped}",
                )
            } catch (e: Exception) {
                _internal.value = _internal.value.copy(busy = false, message = "Sync failed: ${e.message}")
            }
        }
    }
}

private data class Quad<A, B, C, D>(val a: A, val b: B, val c: C, val d: D)
