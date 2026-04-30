package com.callyzerclone.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.callyzerclone.app.ui.AppViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {
    private val vm: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = lightColorScheme()) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    AppRoot(vm)
                }
            }
        }
    }
}

@Composable
private fun AppRoot(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    if (state.token.isNullOrBlank()) {
        LoginScreen(vm, state)
    } else {
        SyncScreen(vm, state)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LoginScreen(vm: AppViewModel, state: com.callyzerclone.app.ui.UiState) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Callyzer Clone", style = MaterialTheme.typography.headlineMedium)
        Text("Sign in to start syncing your call log.", style = MaterialTheme.typography.bodyMedium)

        OutlinedTextField(
            value = state.baseUrl,
            onValueChange = vm::setBaseUrl,
            label = { Text("API URL") },
            placeholder = { Text("https://callyzer-yourname.vercel.app") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = state.email,
            onValueChange = vm::setEmail,
            label = { Text("Email") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = state.password,
            onValueChange = vm::setPassword,
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Button(
            onClick = vm::login,
            enabled = !state.busy,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (state.busy) "Signing in..." else "Sign in")
        }

        state.message?.let { Text(it, style = MaterialTheme.typography.bodySmall) }

        Spacer(Modifier.height(16.dp))
        Text(
            "Tip: paste the dashboard URL your admin gave you " +
                "(e.g. https://callyzer-yourname.vercel.app).",
            style = MaterialTheme.typography.labelSmall,
        )
    }
}

@Composable
private fun SyncScreen(vm: AppViewModel, state: com.callyzerclone.app.ui.UiState) {
    val context = LocalContext.current
    var hasPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CALL_LOG)
                == PackageManager.PERMISSION_GRANTED,
        )
    }
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions(),
    ) { results ->
        hasPermission = results[Manifest.permission.READ_CALL_LOG] == true
    }

    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Hello, ${state.userName ?: "you"}", style = MaterialTheme.typography.headlineSmall)
        Text("API: ${state.baseUrl}", style = MaterialTheme.typography.bodySmall)
        Text(
            "Last sync: " +
                if (state.lastSync == 0L) "never"
                else SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date(state.lastSync)),
            style = MaterialTheme.typography.bodyMedium,
        )

        if (!hasPermission) {
            Card {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Call log access required", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "Grant the app permission to read your phone's call log so it can " +
                            "upload entries to your dashboard.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Button(onClick = {
                        launcher.launch(arrayOf(Manifest.permission.READ_CALL_LOG, Manifest.permission.READ_CONTACTS))
                    }) { Text("Grant permission") }
                }
            }
        }

        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Button(
                onClick = vm::syncNow,
                enabled = !state.busy && hasPermission,
                modifier = Modifier.weight(1f),
            ) { Text(if (state.busy) "Syncing..." else "Sync now") }

            OutlinedButton(onClick = vm::logout) { Text("Sign out") }
        }

        state.message?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
    }
}
