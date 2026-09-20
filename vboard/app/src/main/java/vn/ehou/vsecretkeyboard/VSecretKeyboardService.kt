package vn.ehou.vsecretkeyboard

import android.content.Context
import android.content.Intent
import android.inputmethodservice.InputMethodService
import android.os.SystemClock
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.LinearLayout
import android.widget.TextView
import java.text.Normalizer
import java.util.Locale

class VSecretKeyboardService : InputMethodService() {

    companion object {
        var instance: VSecretKeyboardService? = null
            private set

        var activeHexMode: Char = '0'
            private set

        fun injectVoiceText(text: String, isFinal: Boolean): Boolean {
            val srv = instance ?: return false
            if (!srv.isInputViewShown) return false
            val ic = srv.currentInputConnection ?: return false
            if (isFinal) {
                ic.finishComposingText()
                val spaceAppend = if (activeHexMode == '2' || activeHexMode == 'd' || activeHexMode == 'c') "" else " "
                ic.commitText(text + spaceAppend, 1)
            } else {
                ic.setComposingText(text, 1)
            }
            return true
        }

        fun transcodeText(input: String): String {
            if (input.isBlank() || activeHexMode == '0') return input

            fun transformWords(text: String, transform: (String) -> String): String {
                val tokens = text.split(" ")
                return tokens.joinToString(" ") { t ->
                    val clean = t.trim(',', '.', '!', '?', ';', ':', '-', '"', '\'')
                    if (clean.isNotEmpty()) {
                        val replaced = transform(clean)
                        t.replace(clean, replaced)
                    } else t
                }
            }

            return when (activeHexMode) {
                '1' -> { // Base60 (cách từ)
                    transformWords(input) { w ->
                        val enc = VCompEngine.encodeWord(w)
                        VCompEngine.timeToBase60(enc)
                    }
                }
                '2' -> { // Base60 liền
                    val tokens = input.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
                    tokens.joinToString("") { t ->
                        val clean = t.trim(',', '.', '!', '?', ';', ':', '-', '"', '\'')
                        if (clean.isNotEmpty()) {
                            val enc = VCompEngine.encodeWord(clean)
                            VCompEngine.timeToBase60(enc)
                        } else t
                    }
                }
                '3' -> { // Giờ thiêng [4 số]
                    transformWords(input) { w ->
                        val enc = VCompEngine.encodeWord(w)
                        if (enc.length >= 4) enc.substring(0, 4) else enc
                    }
                }
                '8' -> { // Thời gian [6 số]
                    transformWords(input) { w ->
                        VCompEngine.encodeWord(w)
                    }
                }
                '9' -> { // Thời gian [5 số]
                    transformWords(input) { w ->
                        val enc = VCompEngine.encodeWord(w)
                        VCompEngine.timeTo5Digit(enc)
                    }
                }
                'a' -> { // CVNSS 4.0
                    transformWords(input) { w ->
                        VCompEngine.encodeCVNSS4Word(w)
                    }
                }
                'b' -> { // Mã Giả Việt (♰...♰)
                    VCompEngine.toFakeViet(input)
                }
                'c' -> { // camelCase
                    VCompEngine.toCamelCase(input)
                }
                'd' -> { // Không dấu liền
                    VCompEngine.toNoAccentContinuous(input)
                }
                'e' -> { // Giả Việt Tối giản (Zero-Font Bypass)
                    VCompEngine.toFakeVietMinimal(input)
                }
                else -> input
            }
        }
    }

    private lateinit var keyboardRoot: View
    private lateinit var swipeKeyboardView: SwipeKeyboardView
    private lateinit var btnMode: TextView
    private lateinit var tvLayerStatus: TextView
    private lateinit var btnHelp: TextView
    private lateinit var btnSettings: TextView
    private lateinit var btnMic: TextView
    private lateinit var helpDrawer: LinearLayout
    private lateinit var btnCloseHelp: TextView

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    override fun onCreateInputView(): View {
        keyboardRoot = layoutInflater.inflate(R.layout.keyboard_layout, null)

        swipeKeyboardView = keyboardRoot.findViewById(R.id.swipe_keyboard_view)
        btnMode = keyboardRoot.findViewById(R.id.btn_mode)
        tvLayerStatus = keyboardRoot.findViewById(R.id.tv_layer_status)
        btnHelp = keyboardRoot.findViewById(R.id.btn_help)
        btnSettings = keyboardRoot.findViewById(R.id.btn_settings)
        btnMic = keyboardRoot.findViewById(R.id.btn_mic)
        helpDrawer = keyboardRoot.findViewById(R.id.help_drawer)
        btnCloseHelp = keyboardRoot.findViewById(R.id.btn_close_help)

        setupListeners()
        return keyboardRoot
    }

    private fun setupListeners() {
        // Nút bấm Mode trên toolbar: Bật/tắt Mode layer
        btnMode.setOnClickListener {
            swipeKeyboardView.toggleModeLayer()
        }

        // Nút ? HELP: Bật/tắt Drawer tra cứu
        btnHelp.setOnClickListener {
            val isShown = helpDrawer.visibility == View.VISIBLE
            helpDrawer.visibility = if (isShown) View.GONE else View.VISIBLE
        }

        // Nút ⚙️ SETTINGS: Mở giao diện ứng dụng Vboard
        btnSettings.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(intent)
        }

        btnCloseHelp.setOnClickListener {
            helpDrawer.visibility = View.GONE
        }

        // Nút 🎙️ MIC trên toolbar: Ép buộc lắng nghe giọng nói ngay lập tức
        btnMic.setOnClickListener {
            toggleVoiceDictation()
        }

        HandsFreeVoiceService.onListeningStateChanged = { isListening ->
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                updateMicButtonVisual(isListening)
            }
        }

        // Lắng nghe thay đổi tầng phím để cập nhật Text trạng thái
        swipeKeyboardView.onLayerChanged = { layer ->
            when (layer) {
                SwipeKeyboardView.KeyboardLayer.NORMAL -> {
                    tvLayerStatus.text = if (swipeKeyboardView.isShiftActive) "⇧ SHIFT" else "Tầng: Thường"
                    tvLayerStatus.setTextColor(android.graphics.Color.parseColor("#8B949E"))
                }
                SwipeKeyboardView.KeyboardLayer.MODE -> {
                    tvLayerStatus.text = "⚡ Mode Layer"
                    tvLayerStatus.setTextColor(android.graphics.Color.parseColor("#3FB950"))
                }
                SwipeKeyboardView.KeyboardLayer.VOWEL_SELECTOR -> {
                    tvLayerStatus.text = if (swipeKeyboardView.isVowelSymbolShift) "✨ Ký hiệu Mở rộng" else "🇻🇳 Tầng [ớ]: d=đ, s=Đ"
                    tvLayerStatus.setTextColor(android.graphics.Color.parseColor("#388BFD"))
                }
                SwipeKeyboardView.KeyboardLayer.VOWEL_MATRIX -> {
                    tvLayerStatus.text = "🇻🇳 Biến thể: ${swipeKeyboardView.activeVowelKey}"
                    tvLayerStatus.setTextColor(android.graphics.Color.parseColor("#D29922"))
                }
                SwipeKeyboardView.KeyboardLayer.MACRO_PALETTE -> {
                    tvLayerStatus.text = "⚡ Tốc ký [${swipeKeyboardView.activeMacroKey.uppercase()}]"
                    tvLayerStatus.setTextColor(android.graphics.Color.parseColor("#7EE787"))
                }
            }
        }

        // Xử lý toàn bộ hành động từ bàn phím
        swipeKeyboardView.onAction = { action ->
            handleKeyboardAction(action)
        }
    }

    private fun toggleVoiceDictation() {
        val voiceService = HandsFreeVoiceService.instance
        if (voiceService != null && voiceService.isCurrentlyListening()) {
            voiceService.stopForceListening()
            updateMicButtonVisual(false)
        } else {
            updateMicButtonVisual(true)
            if (voiceService != null) {
                voiceService.forceStartListening()
            } else {
                HandsFreeVoiceService.start(this, forceListen = true)
            }
        }
    }

    private fun updateMicButtonVisual(isListening: Boolean) {
        if (!::btnMic.isInitialized) return
        if (isListening) {
            btnMic.text = "🔴"
            btnMic.setTextColor(android.graphics.Color.parseColor("#FF7B72"))
            btnMic.setBackgroundColor(android.graphics.Color.parseColor("#49151C"))
        } else {
            btnMic.text = "🎙️"
            btnMic.setTextColor(android.graphics.Color.parseColor("#58A6FF"))
            btnMic.setBackgroundColor(android.graphics.Color.parseColor("#1F242C"))
        }
    }

    private fun handleKeyboardAction(action: SwipeKeyboardView.KeyboardAction) {
        val ic = currentInputConnection ?: return

        when (action) {
            is SwipeKeyboardView.KeyboardAction.CommitText -> {
                if (action.text == " ") {
                    if (activeHexMode != '0') {
                        val textBefore = ic.getTextBeforeCursor(100, 0)?.toString() ?: ""
                        val match = Regex("([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)$").find(textBefore)
                        if (match != null) {
                            val lastWord = match.value
                            val transcoded = transcodeText(lastWord)
                            if (transcoded != lastWord) {
                                ic.deleteSurroundingText(lastWord.length, 0)
                                ic.commitText(transcoded, 1)
                            }
                        }
                    }
                    if (activeHexMode != '2' && activeHexMode != 'd' && activeHexMode != 'c') {
                        ic.commitText(" ", 1)
                    }
                } else if (action.text.isNotEmpty()) {
                    ic.commitText(action.text, 1)
                }
            }

            is SwipeKeyboardView.KeyboardAction.WrapText -> {
                val selected = ic.getSelectedText(0)?.toString()
                if (!selected.isNullOrEmpty()) {
                    ic.commitText("${action.open}$selected${action.close}", 1)
                } else {
                    ic.commitText("${action.open}${action.close}", 1)
                    // Đưa con trỏ vào giữa cặp ngoặc
                    sendDownUpKeyEvents(KeyEvent.KEYCODE_DPAD_LEFT)
                }
            }

            SwipeKeyboardView.KeyboardAction.Backspace -> {
                val selected = ic.getSelectedText(0)?.toString()
                if (!selected.isNullOrEmpty()) {
                    ic.commitText("", 1)
                } else {
                    val deleted = ic.deleteSurroundingText(1, 0)
                    if (!deleted) {
                        sendDownUpKeyEvents(KeyEvent.KEYCODE_DEL)
                    }
                }
            }

            SwipeKeyboardView.KeyboardAction.DeleteForward -> {
                val selected = ic.getSelectedText(0)?.toString()
                if (!selected.isNullOrEmpty()) {
                    ic.commitText("", 1)
                } else {
                    val deleted = ic.deleteSurroundingText(0, 1)
                    if (!deleted) {
                        sendDownUpKeyEvents(KeyEvent.KEYCODE_FORWARD_DEL)
                    }
                }
            }

            SwipeKeyboardView.KeyboardAction.DeleteWordBackward -> {
                val selected = ic.getSelectedText(0)?.toString()
                if (!selected.isNullOrEmpty()) {
                    ic.commitText("", 1)
                } else {
                    val textBefore = ic.getTextBeforeCursor(100, 0)?.toString() ?: ""
                    if (textBefore.isNotEmpty()) {
                        var trimmed = textBefore
                        var delCount = 0
                        while (trimmed.isNotEmpty() && trimmed.last().isWhitespace()) {
                            trimmed = trimmed.substring(0, trimmed.length - 1)
                            delCount++
                        }
                        while (trimmed.isNotEmpty() && !trimmed.last().isWhitespace()) {
                            trimmed = trimmed.substring(0, trimmed.length - 1)
                            delCount++
                        }
                        if (delCount > 0) {
                            val deleted = ic.deleteSurroundingText(delCount, 0)
                            if (!deleted) {
                                repeat(delCount) { sendDownUpKeyEvents(KeyEvent.KEYCODE_DEL) }
                            }
                        }
                    } else {
                        sendDownUpKeyEvents(KeyEvent.KEYCODE_DEL)
                    }
                }
            }

            SwipeKeyboardView.KeyboardAction.ClearAll -> {
                val selected = ic.getSelectedText(0)?.toString()
                if (!selected.isNullOrEmpty()) {
                    ic.commitText("", 1)
                }
                val before = ic.getTextBeforeCursor(100000, 0)?.toString() ?: ""
                val after = ic.getTextAfterCursor(100000, 0)?.toString() ?: ""
                if (before.isNotEmpty() || after.isNotEmpty()) {
                    ic.deleteSurroundingText(before.length, after.length)
                }
                // Fallback: Nếu vẫn còn ký tự hoặc ứng dụng không hỗ trợ cursor query, bôi đen toàn bộ rồi xóa
                ic.performContextMenuAction(android.R.id.selectAll)
                ic.commitText("", 1)
            }

            SwipeKeyboardView.KeyboardAction.ToggleCase -> {
                val selected = ic.getSelectedText(0)?.toString()
                if (!selected.isNullOrEmpty()) {
                    val transformed = if (selected == selected.uppercase(Locale.getDefault())) {
                        selected.lowercase(Locale.getDefault())
                    } else {
                        selected.uppercase(Locale.getDefault())
                    }
                    ic.commitText(transformed, 1)
                }
            }

            SwipeKeyboardView.KeyboardAction.Undo -> {
                sendCtrlKey(KeyEvent.KEYCODE_Z)
            }

            SwipeKeyboardView.KeyboardAction.Redo -> {
                sendCtrlKey(KeyEvent.KEYCODE_Y)
            }

            // ===== 4 TÍNH NĂNG BÔI ĐEN CHUYÊN SÂU =====
            SwipeKeyboardView.KeyboardAction.SelectAll -> {
                val before = ic.getTextBeforeCursor(100000, 0)?.toString() ?: ""
                val after = ic.getTextAfterCursor(100000, 0)?.toString() ?: ""
                ic.setSelection(0, before.length + after.length)
            }

            SwipeKeyboardView.KeyboardAction.SelectToStart -> {
                // Bôi đen từ vị trí con trỏ về đầu văn bản
                val before = ic.getTextBeforeCursor(100000, 0)?.toString() ?: ""
                ic.setSelection(0, before.length)
            }

            SwipeKeyboardView.KeyboardAction.SelectToEnd -> {
                // Bôi đen từ vị trí con trỏ về cuối văn bản
                val before = ic.getTextBeforeCursor(100000, 0)?.toString() ?: ""
                val after = ic.getTextAfterCursor(100000, 0)?.toString() ?: ""
                ic.setSelection(before.length, before.length + after.length)
            }

            SwipeKeyboardView.KeyboardAction.SelectParagraph -> {
                // Bôi đen toàn bộ đoạn văn tại vị trí con trỏ
                val before = ic.getTextBeforeCursor(100000, 0)?.toString() ?: ""
                val after = ic.getTextAfterCursor(100000, 0)?.toString() ?: ""
                val prevN = before.lastIndexOf('\n')
                val start = if (prevN == -1) 0 else prevN + 1
                val nextN = after.indexOf('\n')
                val end = if (nextN == -1) before.length + after.length else before.length + nextN
                ic.setSelection(start, end)
            }

            SwipeKeyboardView.KeyboardAction.SelectToEndOfSentence -> {
                // Bôi đen từ con trỏ tới cuối câu (. ! ? hoặc \n)
                val before = ic.getTextBeforeCursor(100000, 0)?.toString() ?: ""
                val after = ic.getTextAfterCursor(100000, 0)?.toString() ?: ""
                val match = Regex("[.!?\\n]").find(after)
                val end = if (match != null) before.length + match.range.first + 1 else before.length + after.length
                ic.setSelection(before.length, end)
            }

            SwipeKeyboardView.KeyboardAction.SelectToStartOfSentence -> {
                // Bôi đen từ con trỏ về đầu câu (. ! ? hoặc \n)
                val before = ic.getTextBeforeCursor(100000, 0)?.toString() ?: ""
                var lastBoundary = -1
                for (i in before.length - 1 downTo 0) {
                    val ch = before[i]
                    if (ch == '.' || ch == '!' || ch == '?' || ch == '\n') {
                        lastBoundary = i
                        break
                    }
                }
                var start = if (lastBoundary == -1) 0 else lastBoundary + 1
                while (start < before.length && (before[start] == ' ' || before[start] == '\t')) {
                    start++
                }
                ic.setSelection(start, before.length)
            }

            SwipeKeyboardView.KeyboardAction.Paste -> {
                val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as? android.content.ClipboardManager
                val clip = clipboard?.primaryClip
                if (clip != null && clip.itemCount > 0) {
                    val pasteText = clip.getItemAt(0).coerceToText(this)?.toString()
                    if (!pasteText.isNullOrEmpty()) {
                        ic.commitText(pasteText, 1)
                    }
                }
            }

            // ===== ĐIỀU HƯỚNG CON TRỎ =====
            SwipeKeyboardView.KeyboardAction.MoveLeft -> {
                sendDownUpKeyEvents(KeyEvent.KEYCODE_DPAD_LEFT)
            }

            SwipeKeyboardView.KeyboardAction.MoveRight -> {
                sendDownUpKeyEvents(KeyEvent.KEYCODE_DPAD_RIGHT)
            }

            SwipeKeyboardView.KeyboardAction.MoveUp -> {
                sendDownUpKeyEvents(KeyEvent.KEYCODE_DPAD_UP)
            }

            SwipeKeyboardView.KeyboardAction.MoveDown -> {
                sendDownUpKeyEvents(KeyEvent.KEYCODE_DPAD_DOWN)
            }

            SwipeKeyboardView.KeyboardAction.MoveHome -> {
                val before = ic.getTextBeforeCursor(100000, 0)?.toString() ?: ""
                val prevN = before.lastIndexOf('\n')
                val homePos = if (prevN == -1) 0 else prevN + 1
                ic.setSelection(homePos, homePos)
            }

            SwipeKeyboardView.KeyboardAction.MoveEnd -> {
                val before = ic.getTextBeforeCursor(100000, 0)?.toString() ?: ""
                val after = ic.getTextAfterCursor(100000, 0)?.toString() ?: ""
                val nextN = after.indexOf('\n')
                val endPos = if (nextN == -1) before.length + after.length else before.length + nextN
                ic.setSelection(endPos, endPos)
            }

            SwipeKeyboardView.KeyboardAction.Search -> {
                if (!sendDefaultEditorAction(true)) {
                    ic.performEditorAction(EditorInfo.IME_ACTION_SEARCH)
                }
            }

            SwipeKeyboardView.KeyboardAction.Enter -> {
                sendKeyChar('\n')
            }

            // ===== CHUYỂN ĐỔI CHẾ ĐỘ BASE-16 =====
            is SwipeKeyboardView.KeyboardAction.SwitchMode -> {
                activeHexMode = action.hexKey
                btnMode.text = "${action.icon} ${action.modeName}"
                // Tự động trả về tầng thường sau khi chọn Mode
                swipeKeyboardView.setLayer(SwipeKeyboardView.KeyboardLayer.NORMAL)
            }
        }
    }

    private fun sendCtrlKey(keyCode: Int) {
        val ic = currentInputConnection ?: return
        val now = SystemClock.uptimeMillis()
        ic.sendKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, keyCode, 0, KeyEvent.META_CTRL_ON))
        ic.sendKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, keyCode, 0, KeyEvent.META_CTRL_ON))
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        if (::swipeKeyboardView.isInitialized) {
            swipeKeyboardView.setLayer(SwipeKeyboardView.KeyboardLayer.NORMAL)
        }
        if (::helpDrawer.isInitialized) {
            helpDrawer.visibility = View.GONE
        }
    }

    override fun onDestroy() {
        HandsFreeVoiceService.onListeningStateChanged = null
        if (instance == this) {
            instance = null
        }
        super.onDestroy()
    }
}
