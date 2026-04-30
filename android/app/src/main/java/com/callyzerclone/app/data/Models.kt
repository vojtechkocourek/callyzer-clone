package com.callyzerclone.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val mode: String = "api",
)

@Serializable
data class LoginResponse(
    val token: String,
    val user: UserDto,
)

@Serializable
data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val teamId: String? = null,
)

@Serializable
data class CallDto(
    val phoneNumber: String,
    val contactName: String? = null,
    val type: String, // incoming | outgoing | missed | rejected
    val startedAt: String, // ISO-8601 UTC
    val durationSec: Int,
)

@Serializable
data class SyncRequest(
    val calls: List<CallDto>,
)

@Serializable
data class SyncResponse(
    val added: Int,
    val skipped: Int,
)

@Serializable
data class ApiError(
    @SerialName("error") val message: String,
)
