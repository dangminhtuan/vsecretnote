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
 * Service chạy nền lắng nghe giọng nói với tốc độ phản hồi tức thì (Live Streaming):
 * Nhận diện từ khóa "Chiến thôi" linh hoạt và stream chữ trực tiếp theo thời gian thực (0.2s).
 */
class HandsFreeVoiceService : Service(), RecognitionListener {

    companion object {
        private const val TAG = "VboardVoiceService"
        private const val CHANNEL_ID = "vboard_handsfree_channel"
        private const val NOTIFICATION_ID = 2026

        var isServiceRunning = false
            private set

        var instance: HandsFreeVoiceService? = null
            private set

        var onListeningStateChanged: ((Boolean) -> Unit)? = null

        fun start(context: Context, forceListen: Boolean = false) {
            val intent = Intent(context, HandsFreeVoiceService::class.java).apply {
                if (forceListen) putExtra("force_listen", true)
            }
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
    private var hasBeepedForCurrentTrigger = false

    fun isCurrentlyListening(): Boolean = isAwaitingContent

    // Bộ đếm thời gian tự hủy chế độ chờ sau 6 giây
    private val timeoutRunnable = Runnable {
        if (isAwaitingContent) {
            isAwaitingContent = false
            hasBeepedForCurrentTrigger = false
            HandsFreeAccessibilityService.instance?.resetSessionBase()
            updateNotification("Nói: 'Chiến thôi [nội dung]'")
            onListeningStateChanged?.invoke(false)
            Log.d(TAG, "Đã hết thời gian chờ nội dung (Timeout 6s).")
        }
    }

    fun forceStartListening() {
        mainHandler.post {
            isAwaitingContent = true
            hasBeepedForCurrentTrigger = true
            HandsFreeAccessibilityService.instance?.resetSessionBase()
            HandsFreeAccessibilityService.instance?.playBeep()
            HandsFreeAccessibilityService.instance?.vibratePattern(longArrayOf(0, 50, 40, 50))
            
            mainHandler.removeCallbacks(timeoutRunnable)
            mainHandler.postDelayed(timeoutRunnable, 7000)

            updateNotification("🎙️ Đang lắng nghe... Hãy nói nội dung!")
            onListeningStateChanged?.invoke(true)

            if (!isListening) {
                startListening()
            }
        }
    }

    fun stopForceListening() {
        mainHandler.post {
            isAwaitingContent = false
            hasBeepedForCurrentTrigger = false
            mainHandler.removeCallbacks(timeoutRunnable)
            HandsFreeAccessibilityService.instance?.resetSessionBase()
            stopListening()
            updateNotification("Nói: 'Chiến thôi [nội dung]'")
            onListeningStateChanged?.invoke(false)
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        isServiceRunning = true
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification("Đang sẵn sàng lắng nghe khẩu lệnh..."))
        initSpeechRecognizer()
        startListening()
        Log.i(TAG, "HandsFreeVoiceService đã khởi chạy.")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.getBooleanExtra("force_listen", false) == true) {
            mainHandler.postDelayed({
                forceStartListening()
            }, 300)
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        if (instance == this) {
            instance = null
        }
        isServiceRunning = false
        onListeningStateChanged?.invoke(false)
        mainHandler.removeCallbacksAndMessages(null)
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
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, packageName)
                }

                isListening = true
                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Lỗi khi gọi startListening: ${e.message}")
                isListening = false
                scheduleRestart(800)
            }
        }
    }

    private fun stopListening() {
        isListening = false
        try {
            speechRecognizer?.stopListening()
        } catch (_: Exception) {}
    }

    private fun scheduleRestart(delayMs: Long = 200) {
        isListening = false
        if (!isServiceRunning) return
        mainHandler.removeCallbacksAndMessages(null)
        // Duy trì lại timeout nếu đang chờ nội dung
        if (isAwaitingContent) {
            mainHandler.postDelayed(timeoutRunnable, 6000)
        }
        mainHandler.postDelayed({
            startListening()
        }, delayMs)
    }

    // --- RecognitionListener Callbacks ---

    override fun onReadyForSpeech(params: Bundle?) {
        if (!isAwaitingContent) {
            hasBeepedForCurrentTrigger = false
        }
    }

    override fun onBeginningOfSpeech() {}

    override fun onRmsChanged(rmsdB: Float) {}

    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
        isListening = false
    }

    override fun onError(error: Int) {
        isListening = false
        val isQuietTimeout = (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT)
        if (!isQuietTimeout) {
            Log.w(TAG, "SpeechRecognizer báo mã lỗi: $error")
            if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || error == SpeechRecognizer.ERROR_CLIENT) {
                destroySpeechRecognizer()
            }
        }
        scheduleRestart(if (isQuietTimeout) 150 else 600)
    }

    /**
     * ⚡ LIVE STREAMING: Chữ vừa được phát âm là điền ngay vào ô màn hình lập tức!
     */
    override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val text = matches?.firstOrNull() ?: ""
        if (text.isNotBlank()) {
            handleSpokenText(text, isFinal = false)
        }
    }

    /**
     * Chốt câu khi người dùng kết thúc phát ngôn
     */
    override fun onResults(results: Bundle?) {
        isListening = false
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val text = matches?.firstOrNull() ?: ""

        if (text.isNotBlank()) {
            handleSpokenText(text, isFinal = true)
        } else if (isAwaitingContent) {
            // Không nhận diện được gì thêm
            HandsFreeAccessibilityService.instance?.resetSessionBase()
        }
        scheduleRestart(200)
    }

    override fun onEvent(eventType: Int, params: Bundle?) {}

    /**
     * Phân tích giọng nói và stream ngay tức thì
     */
    private fun handleSpokenText(spokenText: String, isFinal: Boolean) {
        val lower = spokenText.lowercase(Locale.getDefault()).trim()
        val triggers = listOf("chiến thôi", "chienthoi", "chiến thui", "chiến đi", "chiến", "alo vboard")

        var triggerIndex = -1
        var triggerLength = 0

        for (trigger in triggers) {
            val idx = lower.indexOf(trigger)
            if (idx != -1) {
                triggerIndex = idx
                triggerLength = trigger.length
                break
            }
        }

        if (triggerIndex != -1) {
            // Phát hiện thấy từ khóa "Chiến thôi" (dù nằm ở đầu hay giữa câu)
            if (!hasBeepedForCurrentTrigger) {
                hasBeepedForCurrentTrigger = true
                HandsFreeAccessibilityService.instance?.playBeep()
                HandsFreeAccessibilityService.instance?.vibratePattern(longArrayOf(0, 50, 40, 50))
            }

            // Lấy toàn bộ phần lời nói nằm sau chữ "chiến thôi"
            val rawContent = spokenText.substring(triggerIndex + triggerLength).trimStart(',', '.', ' ', ':', ';', '-')
            if (rawContent.isNotBlank()) {
                // Người dùng nói liền mạch: "Chiến thôi [nội dung...]"
                isAwaitingContent = false
                mainHandler.removeCallbacks(timeoutRunnable)
                val formatted = VietnamesePunctuationFormatter.format(rawContent)
                val transcoded = VSecretKeyboardService.transcodeText(formatted)
                updateNotification("⚡ Live: $transcoded")
                dispatchVoiceText(transcoded, isFinal)
                if (isFinal) {
                    hasBeepedForCurrentTrigger = false
                    onListeningStateChanged?.invoke(false)
                }
            } else {
                // Người dùng mới chỉ nói "Chiến thôi"
                if (!isAwaitingContent) {
                    isAwaitingContent = true
                    HandsFreeAccessibilityService.instance?.resetSessionBase()
                    mainHandler.removeCallbacks(timeoutRunnable)
                    mainHandler.postDelayed(timeoutRunnable, 6000)
                    updateNotification("🎙️ Đã nhận 'Chiến thôi'! Hãy nói nội dung...")
                    onListeningStateChanged?.invoke(true)
                }
            }
        } else if (isAwaitingContent) {
            // Đang trong trạng thái chờ nội dung sau tiếng bíp
            mainHandler.removeCallbacks(timeoutRunnable)
            if (!isFinal) {
                mainHandler.postDelayed(timeoutRunnable, 6000)
            }
            val formatted = VietnamesePunctuationFormatter.format(spokenText)
            val transcoded = VSecretKeyboardService.transcodeText(formatted)
            updateNotification("⚡ Live: $transcoded")
            dispatchVoiceText(transcoded, isFinal)
            if (isFinal) {
                isAwaitingContent = false
                hasBeepedForCurrentTrigger = false
                onListeningStateChanged?.invoke(false)
            }
        }
    }

    /**
     * Phân phối text giọng nói:
     * 1. Ưu tiên điền trực tiếp qua InputConnection (0ms) nếu bàn phím vBoard đang mở
     * 2. Fallback sang AccessibilityService nếu đang dùng rảnh tay nền
     */
    private fun dispatchVoiceText(text: String, isFinal: Boolean) {
        val injectedDirectly = VSecretKeyboardService.injectVoiceText(text, isFinal)
        if (!injectedDirectly) {
            HandsFreeAccessibilityService.instance?.injectStreamingText(text, isFinal)
        } else if (isFinal) {
            HandsFreeAccessibilityService.instance?.vibratePattern(longArrayOf(0, 30))
        }
    }
}
