package vn.ehou.vsecretkeyboard

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.core.app.NotificationCompat
import java.util.Locale

/**
 * Service chạy nền lắng nghe âm thanh liên tục (Foreground Service):
 * Bắt khẩu lệnh "Chiến thôi" và chuyển tiếp nội dung cần nhập sang HandsFreeAccessibilityService.
 */
class HandsFreeVoiceService : Service(), RecognitionListener {

    companion object {
        private const val TAG = "VboardVoiceService"
        private const val CHANNEL_ID = "vboard_handsfree_channel"
        private const val NOTIFICATION_ID = 2026

        var isServiceRunning = false
            private set

        fun start(context: Context) {
            val intent = Intent(context, HandsFreeVoiceService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, HandsFreeVoiceService::class.java)
            context.stopService(intent)
        }
    }

    private var speechRecognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var isAwaitingContent = false
    private var isListening = false

    override fun onCreate() {
        super.onCreate()
        isServiceRunning = true
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification("Đang sẵn sàng lắng nghe khẩu lệnh..."))
        initSpeechRecognizer()
        startListening()
        Log.i(TAG, "HandsFreeVoiceService đã khởi chạy.")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isServiceRunning = false
        stopListening()
        destroySpeechRecognizer()
        super.onDestroy()
        Log.i(TAG, "HandsFreeVoiceService đã dừng.")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.handsfree_notif_channel),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Kênh duy trì micro lắng nghe rảnh tay"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(statusText: String): Notification {
        val launchIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.handsfree_notif_title))
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(statusText: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        manager?.notify(NOTIFICATION_ID, buildNotification(statusText))
    }

    private fun initSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
                setRecognitionListener(this@HandsFreeVoiceService)
            }
        } else {
            Log.e(TAG, "Thiết bị không hỗ trợ SpeechRecognizer.")
        }
    }

    private fun destroySpeechRecognizer() {
        try {
            speechRecognizer?.destroy()
            speechRecognizer = null
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi giải phóng SpeechRecognizer: ${e.message}")
        }
    }

    private fun startListening() {
        if (!isServiceRunning) return
        if (isListening) return

        mainHandler.post {
            try {
                if (speechRecognizer == null) {
                    initSpeechRecognizer()
                }

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "vi-VN")
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "vi-VN")
                    putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, "vi-VN")
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                    putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, packageName)
                }

                isListening = true
                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Lỗi khi gọi startListening: ${e.message}")
                isListening = false
                scheduleRestart(1000)
            }
        }
    }

    private fun stopListening() {
        isListening = false
        try {
            speechRecognizer?.stopListening()
        } catch (_: Exception) {}
    }

    private fun scheduleRestart(delayMs: Long = 300) {
        isListening = false
        if (!isServiceRunning) return
        mainHandler.removeCallbacksAndMessages(null)
        mainHandler.postDelayed({
            startListening()
        }, delayMs)
    }

    // --- RecognitionListener Callbacks ---

    override fun onReadyForSpeech(params: Bundle?) {
        updateNotification(if (isAwaitingContent) "Đang nghe nội dung cần nhập..." else "Nói: 'Chiến thôi [nội dung]'")
    }

    override fun onBeginningOfSpeech() {}

    override fun onRmsChanged(rmsdB: Float) {}

    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
        isListening = false
    }

    override fun onError(error: Int) {
        isListening = false
        // Error 7 = NO_MATCH, Error 6 = SPEECH_TIMEOUT (thường xuyên xảy ra khi người dùng im lặng)
        val isQuietTimeout = (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT)
        if (!isQuietTimeout) {
            Log.w(TAG, "SpeechRecognizer báo mã lỗi: $error")
            if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || error == SpeechRecognizer.ERROR_CLIENT) {
                destroySpeechRecognizer()
            }
        }
        scheduleRestart(if (isQuietTimeout) 250 else 800)
    }

    override fun onResults(results: Bundle?) {
        isListening = false
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val text = matches?.firstOrNull() ?: ""

        if (text.isNotBlank()) {
            handleSpokenText(text)
        }
        scheduleRestart(350)
    }

    override fun onPartialResults(partialResults: Bundle?) {}

    override fun onEvent(eventType: Int, params: Bundle?) {}

    /**
     * Xử lý chuỗi giọng nói nhận được
     */
    private fun handleSpokenText(spokenText: String) {
        val lower = spokenText.lowercase(Locale.getDefault()).trim()
        Log.i(TAG, "Giọng nói nhận được: '$spokenText'")

        // Danh sách các biến thể khẩu lệnh "Chiến thôi"
        val triggers = listOf("chiến thôi", "chienthoi", "chiến thui", "chiến", "chiến đi", "alo vboard")
        var matchedTrigger: String? = null

        for (trigger in triggers) {
            if (lower.startsWith(trigger)) {
                matchedTrigger = trigger
                break
            }
        }

        if (matchedTrigger != null) {
            val content = lower.removePrefix(matchedTrigger).trimStart(',', '.', ' ', ':', ';')
            if (content.isNotBlank()) {
                // Trường hợp 1: Người dùng nói liền mạch "Chiến thôi tối nay đi nhậu nhé"
                updateNotification("Đã nhập: $content")
                HandsFreeAccessibilityService.instance?.injectText(content)
                isAwaitingContent = false
            } else {
                // Trường hợp 2: Người dùng chỉ mới nói "Chiến thôi"
                // Rung 2 nhịp báo "Tôi đang nghe, hãy nói nội dung tiếp theo!"
                HandsFreeAccessibilityService.instance?.vibratePattern(longArrayOf(0, 70, 70, 70))
                updateNotification("Đã nhận 'Chiến thôi'! Hãy nói nội dung...")
                isAwaitingContent = true
            }
        } else if (isAwaitingContent) {
            // Trường hợp 2 tiếp theo: Nhận nội dung ngay sau khi đã thức tỉnh
            updateNotification("Đã nhập: $spokenText")
            HandsFreeAccessibilityService.instance?.injectText(spokenText)
            isAwaitingContent = false
        }
    }
}
