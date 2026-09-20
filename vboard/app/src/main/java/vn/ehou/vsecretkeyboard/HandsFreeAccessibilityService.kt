package vn.ehou.vsecretkeyboard

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Service Trợ Năng Vboard:
 * Đóng vai trò là "ngón tay vô hình" tự động quét màn hình hiện tại
 * tìm ô nhập liệu (Facebook, Zalo, Messenger, SMS...) và điền văn bản vào.
 * Hỗ trợ chế độ Live Streaming (vừa nói chữ bay ra ngay lập tức).
 */
class HandsFreeAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "VboardAccessibility"
        var instance: HandsFreeAccessibilityService? = null
            private set

        fun isRunning(): Boolean = instance != null
    }

    private var activeNodeTextBeforeSession: String? = null
    private var lastTargetNode: AccessibilityNodeInfo? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "HandsFreeAccessibilityService đã kết nối và sẵn sàng.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Cập nhật khi có sự kiện focus vào ô nhập liệu mới
        if (event?.eventType == AccessibilityEvent.TYPE_VIEW_FOCUSED) {
            val source = event.source
            if (source != null && isInputNode(source)) {
                lastTargetNode = source
            }
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "HandsFreeAccessibilityService bị gián đoạn.")
    }

    override fun onDestroy() {
        if (instance == this) {
            instance = null
        }
        super.onDestroy()
        Log.i(TAG, "HandsFreeAccessibilityService đã dừng.")
    }

    /**
     * Bắt đầu một phiên nhập liệu giọng nói mới
     */
    fun resetSessionBase() {
        activeNodeTextBeforeSession = null
    }

    /**
     * Điền văn bản theo thời gian thực (Real-time Live Streaming):
     * @param text Nội dung hiện tại (từng phần hoặc toàn bộ)
     * @param isFinal true: kết thúc câu; false: đang nói (partial)
     */
    fun injectStreamingText(text: String, isFinal: Boolean): Boolean {
        val targetNode = findTargetInputNode()
        if (targetNode == null) {
            Log.e(TAG, "Không tìm thấy ô nhập liệu nào trên màn hình.")
            return false
        }

        try {
            if (!targetNode.isFocused) {
                targetNode.performAction(AccessibilityNodeInfo.ACTION_FOCUS)
            }

            // Ghi nhớ nội dung đã có trong ô trước khi bắt đầu nói câu này
            if (activeNodeTextBeforeSession == null) {
                activeNodeTextBeforeSession = targetNode.text?.toString() ?: ""
            }

            val base = activeNodeTextBeforeSession ?: ""
            val newText = if (base.isNotBlank()) "$base $text" else text

            val arguments = Bundle().apply {
                putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, newText)
            }
            val success = targetNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)

            // Đặt con trỏ về cuối đoạn text
            try {
                val selectionArgs = Bundle().apply {
                    putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_START_INT, newText.length)
                    putInt(AccessibilityNodeInfo.ACTION_ARGUMENT_SELECTION_END_INT, newText.length)
                }
                targetNode.performAction(AccessibilityNodeInfo.ACTION_SET_SELECTION, selectionArgs)
            } catch (_: Exception) {}

            if (isFinal) {
                activeNodeTextBeforeSession = null // Chốt phiên này
                if (success) {
                    vibrateSuccess()
                }
            }
            return success
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi khi điền text stream: ${e.message}", e)
            return false
        }
    }

    /**
     * Điền toàn bộ văn bản một lần (cho các trường hợp không dùng stream)
     */
    fun injectText(text: String, append: Boolean = true): Boolean {
        return injectStreamingText(text, isFinal = true)
    }

    /**
     * Quét tìm ô EditText trên màn hình hiện tại (Facebook, Zalo, Messenger, SMS...)
     */
    private fun findTargetInputNode(): AccessibilityNodeInfo? {
        // Ưu tiên 1: Node đang có con trỏ nhập liệu (Focus Input)
        val focused = findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
        if (focused != null && isInputNode(focused)) {
            return focused
        }

        // Ưu tiên 2: Node vừa mới focus gần nhất
        lastTargetNode?.let {
            if (isInputNode(it)) return it
        }

        // Ưu tiên 3: Quét cây giao diện của cửa sổ đang kích hoạt
        val root = rootInActiveWindow ?: return null
        return findFirstInputNode(root)
    }

    private fun isInputNode(node: AccessibilityNodeInfo): Boolean {
        val className = node.className?.toString() ?: ""
        return node.isEditable || className.contains("EditText", ignoreCase = true)
    }

    private fun findFirstInputNode(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        if (isInputNode(node)) {
            return node
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val found = findFirstInputNode(child)
            if (found != null) {
                return found
            }
        }
        return null
    }

    /**
     * Phát tiếng bíp trong trẻo tức thì (0.1 giây) khi nhận diện khẩu lệnh "Chiến thôi"
     */
    fun playBeep() {
        try {
            val toneGen = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 85)
            toneGen.startTone(ToneGenerator.TONE_PROP_BEEP, 120)
        } catch (e: Exception) {
            Log.w(TAG, "Không thể phát âm thanh bíp: ${e.message}")
        }
    }

    /**
     * Phản hồi xúc giác (rung nhẹ) báo hiệu đã điền chữ thành công
     */
    fun vibrateSuccess() {
        try {
            val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(80, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    vibrator.vibrate(80)
                }
            }
        } catch (_: Exception) {}
    }

    /**
     * Rung thông báo theo nhịp
     */
    fun vibratePattern(pattern: LongArray) {
        try {
            val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
                } else {
                    vibrator.vibrate(pattern, -1)
                }
            }
        } catch (_: Exception) {}
    }
}
