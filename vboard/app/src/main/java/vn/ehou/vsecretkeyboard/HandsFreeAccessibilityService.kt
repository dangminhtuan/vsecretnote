package vn.ehou.vsecretkeyboard

import android.accessibilityservice.AccessibilityService
import android.content.Context
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
 * tìm ô nhập liệu (EditText / ô chat Zalo, Messenger, SMS...) và điền văn bản vào.
 */
class HandsFreeAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "VboardAccessibility"
        var instance: HandsFreeAccessibilityService? = null
            private set

        fun isRunning(): Boolean = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "HandsFreeAccessibilityService đã kết nối và sẵn sàng.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Lắng nghe các sự kiện thay đổi cửa sổ hoặc focus nếu cần lưu cache
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
     * Điền văn bản vào ô nhập liệu đang hiển thị trên màn hình
     * @param text Nội dung cần điền
     * @param append true: nối thêm vào cuối nếu đã có chữ; false: thay thế toàn bộ
     */
    fun injectText(text: String, append: Boolean = true): Boolean {
        val targetNode = findTargetInputNode()
        if (targetNode == null) {
            Log.e(TAG, "Không tìm thấy ô nhập liệu (EditText) nào trên màn hình.")
            vibratePattern(longArrayOf(0, 50, 50, 50)) // Rung báo lỗi
            return false
        }

        try {
            // Tự động focus hoặc click vào ô text nếu chưa được focus
            if (!targetNode.isFocused) {
                targetNode.performAction(AccessibilityNodeInfo.ACTION_FOCUS)
            }

            val currentText = targetNode.text?.toString() ?: ""
            val newText = if (append && currentText.isNotBlank()) {
                "$currentText $text"
            } else {
                text
            }

            val arguments = Bundle().apply {
                putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, newText)
            }
            val success = targetNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)

            if (success) {
                Log.i(TAG, "Đã điền thành công: '$text' vào ô ${targetNode.className}")
                vibrateSuccess()
            } else {
                Log.w(TAG, "Gửi lệnh ACTION_SET_TEXT thất bại.")
            }
            return success
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi khi điền text vào node: ${e.message}", e)
            return false
        }
    }

    /**
     * Quét tìm ô EditText trên màn hình hiện tại
     */
    private fun findTargetInputNode(): AccessibilityNodeInfo? {
        // Ưu tiên 1: Lấy node đang có con trỏ nhập liệu (Focus Input)
        val focused = findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
        if (focused != null && isInputNode(focused)) {
            return focused
        }

        // Ưu tiên 2: Quét toàn bộ cây giao diện của cửa sổ đang kích hoạt
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
     * Phản hồi xúc giác (rung nhẹ) báo hiệu đã điền chữ thành công
     */
    fun vibrateSuccess() {
        try {
            val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    vibrator.vibrate(100)
                }
            }
        } catch (_: Exception) {}
    }

    /**
     * Rung thông báo theo nhịp (VD: Bíp-Bíp báo đã nhận khẩu lệnh "Chiến thôi")
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
