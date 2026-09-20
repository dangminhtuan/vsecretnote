package vn.ehou.vsecretkeyboard

import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.inputmethodservice.InputMethodService
import android.os.SystemClock
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
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
                        val enc = VCompEngine.encodeWord(w, bypassShortcut = true)
                        VCompEngine.timeToBase60(enc)
                    }
                }
                '2' -> { // Base60 liền
                    val tokens = input.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
                    tokens.joinToString("") { t ->
                        val clean = t.trim(',', '.', '!', '?', ';', ':', '-', '"', '\'')
                        if (clean.isNotEmpty()) {
                            val enc = VCompEngine.encodeWord(clean, bypassShortcut = true)
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
                        VCompEngine.encodeWord(w, bypassShortcut = true)
                    }
                }
                '9' -> { // Thời gian [5 số]
                    transformWords(input) { w ->
                        val enc = VCompEngine.encodeWord(w, bypassShortcut = true)
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

        private val COMMON_ACCENT_MAP = mapOf(
            "vietnam" to "Việt Nam", "viet" to "việt", "nam" to "nam",
            "homnay" to "hôm nay", "nguoi" to "người", "yeu" to "yêu",
            "thuong" to "thương", "truong" to "trường", "hoc" to "học",
            "tap" to "tập", "cong" to "công", "nghe" to "nghệ",
            "thong" to "thông", "tin" to "tin", "du" to "dự",
            "an" to "án", "kiem" to "kiểm", "tra" to "tra",
            "ban" to "bạn", "phim" to "phím", "toc" to "tốc",
            "do" to "độ", "cao" to "cao", "toi" to "tôi",
            "chung" to "chúng", "ta" to "ta", "dang" to "đang",
            "lam" to "làm", "viec" to "việc", "tot" to "tốt",
            "dep" to "đẹp", "rat" to "rất", "on" to "ổn"
        )

        fun generateBase60Candidates(word: String): List<String> {
            val clean = word.trim(',', '.', '!', '?', ';', ':', '-', '"', '\'')
            if (clean.isEmpty() || clean.length > 4) return emptyList()

            val candidateMap = mutableMapOf<String, Int>() // word -> rank

            // 1. Mở rộng mẫu Base60 (Duplicate Key Expansion):
            val basePatterns = when (clean.length) {
                1 -> listOf("${clean[0]}${clean[0]}${clean[0]}") // s -> sss
                2 -> listOf(
                    "${clean[0]}${clean[0]}${clean[1]}",          // cz -> ccz
                    "${clean[0]}${clean[1]}${clean[1]}"           // cz -> czz
                )
                3 -> listOf(clean)
                else -> emptyList()
            }

            fun generateCombinations(pattern: String): List<String> {
                val charVariants = pattern.map { ch ->
                    if (ch.isLetter()) listOf(ch.lowercaseChar(), ch.uppercaseChar()).distinct() else listOf(ch)
                }
                fun gen(index: Int): List<String> {
                    if (index == charVariants.size) return listOf("")
                    val sub = gen(index + 1)
                    val list = mutableListOf<String>()
                    for (c in charVariants[index]) {
                        for (s in sub) {
                            list.add("$c$s")
                        }
                    }
                    return list
                }
                return gen(0)
            }

            // Giải mã từng mẫu Base60 3 ký tự
            for (pat in basePatterns) {
                val combinations = generateCombinations(pat)
                for (cand in combinations) {
                    val time = VCompEngine.base60ToTime(cand)
                    if (time.length == 6 && time.all { it.isDigit() }) {
                        val dec = VCompEngine.decodeWord(time)
                        if (dec.isNotBlank() && !dec.startsWith("[") && !dec.contains("?") && dec != time) {
                            if (DataDictionary.isRealWord(dec)) {
                                val rank = DataDictionary.getWordRank(dec)
                                if (!candidateMap.containsKey(dec) || rank < candidateMap[dec]!!) {
                                    candidateMap[dec] = rank
                                }
                            }
                        }
                    }
                }
            }

            // 2. Dự đoán thông minh khi nhập 1 ký tự: Top các từ phổ biến nhất tiếng Việt bắt đầu bằng chữ cái đó!
            if (clean.length == 1) {
                val topWords = DataDictionary.getTopWordsForChar(clean[0])
                for (w in topWords) {
                    val rank = DataDictionary.getWordRank(w)
                    if (!candidateMap.containsKey(w)) {
                        candidateMap[w] = rank
                    }
                }
            }

            // 3. Sắp xếp toàn bộ ứng viên theo điểm số Thói quen người dùng và Độ phổ biến từ điển
            return candidateMap.keys
                .sortedByDescending { cand ->
                    val rank = candidateMap[cand] ?: 99999
                    UserHabitManager.calculateScore(clean, cand, rank)
                }
        }

        fun generateCandidatesForWord(word: String, ioMode: SwipeKeyboardView.IOMode): List<String> {
            val clean = word.trim(',', '.', '!', '?', ';', ':', '-', '"', '\'')
            if (clean.isEmpty()) return emptyList()

            return when (ioMode) {
                SwipeKeyboardView.IOMode.B60_TO_VN -> {
                    generateBase60Candidates(clean)
                }
                SwipeKeyboardView.IOMode.NO_ACCENT_TO_VN -> {
                    val list = DataDictionary.getAccentedCandidates(clean)
                    if (list.isNotEmpty()) {
                        list.sortedByDescending { cand ->
                            val rank = DataDictionary.getWordRank(cand)
                            UserHabitManager.calculateScore(clean, cand, rank)
                        }
                    } else {
                        emptyList()
                    }
                }
                else -> emptyList()
            }
        }

        fun applyIOModeTransform(word: String, ioMode: SwipeKeyboardView.IOMode): String {
            if (word.isBlank()) return word
            val clean = word.trim(',', '.', '!', '?', ';', ':', '-', '"', '\'')
            if (clean.isEmpty()) return word

            val transformed = when (ioMode) {
                SwipeKeyboardView.IOMode.B60_TO_VN -> {
                    val candidates = generateCandidatesForWord(clean, ioMode)
                    if (candidates.isNotEmpty()) {
                        candidates.first()
                    } else {
                        clean
                    }
                }
                SwipeKeyboardView.IOMode.VN_TO_B60 -> {
                    val enc = VCompEngine.encodeWord(clean, bypassShortcut = true)
                    val b60 = VCompEngine.timeToBase60(enc)
                    if (b60.isNotBlank() && b60 != enc) b60 else clean
                }
                SwipeKeyboardView.IOMode.NO_ACCENT_TO_VN -> {
                    val candidates = generateCandidatesForWord(clean, ioMode)
                    if (candidates.isNotEmpty()) {
                        candidates.first()
                    } else {
                        val lower = clean.lowercase(Locale.getDefault())
                        COMMON_ACCENT_MAP[lower] ?: clean
                    }
                }
                SwipeKeyboardView.IOMode.B60_TO_B60 -> {
                    clean
                }
                SwipeKeyboardView.IOMode.VN_TO_VN -> {
                    if (activeHexMode != '0') transcodeText(clean) else clean
                }
            }
            return word.replace(clean, transformed)
        }
    }

    private lateinit var keyboardRoot: View
    private lateinit var swipeKeyboardView: SwipeKeyboardView
    private lateinit var btnMode: TextView
    private lateinit var tvLayerStatus: TextView
    private lateinit var btnClipboard: TextView
    private lateinit var btnSettings: TextView
    private lateinit var btnMic: TextView
    private lateinit var clipboardDrawer: LinearLayout
    private lateinit var tvClipboardTitle: TextView
    private lateinit var btnClearClipboard: TextView
    private lateinit var btnCloseClipboard: TextView
    private lateinit var containerClipboardItems: LinearLayout
    private var clipChangedListener: ClipboardManager.OnPrimaryClipChangedListener? = null

    // Menu Chọn Chế Độ I/O Overlay (Chuẩn Gboard 2 thao tác)
    private lateinit var iomodeMenuOverlay: LinearLayout
    private lateinit var btnCloseIomode: TextView
    private lateinit var itemIomodeVnVn: LinearLayout
    private lateinit var itemIomodeB60Vn: LinearLayout
    private lateinit var itemIomodeVnB60: LinearLayout
    private lateinit var itemIomodeKdauVn: LinearLayout
    private lateinit var itemIomodeB60B60: LinearLayout
    private lateinit var checkIomodeVnVn: TextView
    private lateinit var checkIomodeB60Vn: TextView
    private lateinit var checkIomodeVnB60: TextView
    private lateinit var checkIomodeKdauVn: TextView
    private lateinit var checkIomodeB60B60: TextView

    private lateinit var suggestionScroll: HorizontalScrollView
    private lateinit var suggestionContainer: LinearLayout
    private var lastSuggestedRawWord: String = ""
    private var lastAutoCommittedWord: String = ""
    private var currentSuggestions: List<String> = emptyList()

    // Guide Layer HUD & Mnemonic Overlay
    private lateinit var guideHudStrip: LinearLayout
    private lateinit var tvGuideHudLine1: TextView
    private lateinit var tvGuideHudLine2: TextView
    private lateinit var mnemonicDialogOverlay: LinearLayout
    private lateinit var tvMnemonicTitle: TextView
    private lateinit var btnCloseMnemonic: TextView
    private lateinit var tvMnemonicLowerTitle: TextView
    private lateinit var tvMnemonicLowerPhrase: TextView
    private lateinit var tvMnemonicLowerRhymes: TextView
    private lateinit var tvMnemonicUpperTitle: TextView
    private lateinit var tvMnemonicUpperPhrase: TextView
    private lateinit var tvMnemonicUpperRhymes: TextView
    private lateinit var tvMnemonicStory: TextView
    private lateinit var tvMnemonicSamples: TextView

    override fun onCreate() {
        super.onCreate()
        instance = this
        DataDictionary.initWords(assets)
        UserHabitManager.init(this)
        setupClipboardListener()
    }

    override fun onCreateInputView(): View {
        keyboardRoot = layoutInflater.inflate(R.layout.keyboard_layout, null)

        swipeKeyboardView = keyboardRoot.findViewById(R.id.swipe_keyboard_view)
        btnMode = keyboardRoot.findViewById(R.id.btn_mode)
        tvLayerStatus = keyboardRoot.findViewById(R.id.tv_layer_status)
        btnClipboard = keyboardRoot.findViewById(R.id.btn_clipboard)
        btnSettings = keyboardRoot.findViewById(R.id.btn_settings)
        btnMic = keyboardRoot.findViewById(R.id.btn_mic)
        clipboardDrawer = keyboardRoot.findViewById(R.id.clipboard_drawer)
        tvClipboardTitle = keyboardRoot.findViewById(R.id.tv_clipboard_title)
        btnClearClipboard = keyboardRoot.findViewById(R.id.btn_clear_clipboard)
        btnCloseClipboard = keyboardRoot.findViewById(R.id.btn_close_clipboard)
        containerClipboardItems = keyboardRoot.findViewById(R.id.container_clipboard_items)

        // Bind Suggestion Strip
        suggestionScroll = keyboardRoot.findViewById(R.id.suggestion_scroll)
        suggestionContainer = keyboardRoot.findViewById(R.id.suggestion_container)

        // Bind Overlay Menu I/O
        iomodeMenuOverlay = keyboardRoot.findViewById(R.id.iomode_menu_overlay)
        btnCloseIomode = keyboardRoot.findViewById(R.id.btn_close_iomode)
        itemIomodeVnVn = keyboardRoot.findViewById(R.id.item_iomode_vn_vn)
        itemIomodeB60Vn = keyboardRoot.findViewById(R.id.item_iomode_b60_vn)
        itemIomodeVnB60 = keyboardRoot.findViewById(R.id.item_iomode_vn_b60)
        itemIomodeKdauVn = keyboardRoot.findViewById(R.id.item_iomode_kdau_vn)
        itemIomodeB60B60 = keyboardRoot.findViewById(R.id.item_iomode_b60_b60)
        checkIomodeVnVn = keyboardRoot.findViewById(R.id.check_iomode_vn_vn)
        checkIomodeB60Vn = keyboardRoot.findViewById(R.id.check_iomode_b60_vn)
        checkIomodeVnB60 = keyboardRoot.findViewById(R.id.check_iomode_vn_b60)
        checkIomodeKdauVn = keyboardRoot.findViewById(R.id.check_iomode_kdau_vn)
        checkIomodeB60B60 = keyboardRoot.findViewById(R.id.check_iomode_b60_b60)

        // Bind Guide Layer HUD
        guideHudStrip = keyboardRoot.findViewById(R.id.guide_hud_strip)
        tvGuideHudLine1 = keyboardRoot.findViewById(R.id.tv_guide_hud_line1)
        tvGuideHudLine2 = keyboardRoot.findViewById(R.id.tv_guide_hud_line2)
        tvGuideHudLine1.isSelected = true
        tvGuideHudLine2.isSelected = true

        // Bind Mnemonic Card Overlay
        mnemonicDialogOverlay = keyboardRoot.findViewById(R.id.mnemonic_dialog_overlay)
        tvMnemonicTitle = keyboardRoot.findViewById(R.id.tv_mnemonic_title)
        btnCloseMnemonic = keyboardRoot.findViewById(R.id.btn_close_mnemonic)
        tvMnemonicLowerTitle = keyboardRoot.findViewById(R.id.tv_mnemonic_lower_title)
        tvMnemonicLowerPhrase = keyboardRoot.findViewById(R.id.tv_mnemonic_lower_phrase)
        tvMnemonicLowerRhymes = keyboardRoot.findViewById(R.id.tv_mnemonic_lower_rhymes)
        tvMnemonicUpperTitle = keyboardRoot.findViewById(R.id.tv_mnemonic_upper_title)
        tvMnemonicUpperPhrase = keyboardRoot.findViewById(R.id.tv_mnemonic_upper_phrase)
        tvMnemonicUpperRhymes = keyboardRoot.findViewById(R.id.tv_mnemonic_upper_rhymes)
        tvMnemonicStory = keyboardRoot.findViewById(R.id.tv_mnemonic_story)
        tvMnemonicSamples = keyboardRoot.findViewById(R.id.tv_mnemonic_samples)

        setupListeners()
        return keyboardRoot
    }

    private fun setupListeners() {
        // Nút bấm Mode trên toolbar: Bật/tắt Mode layer
        btnMode.setOnClickListener {
            swipeKeyboardView.toggleModeLayer()
        }

        // Nút 📋 CLIPBOARD: Bật/tắt Drawer Bộ Nhớ Tạm
        btnClipboard.setOnClickListener {
            val isShown = clipboardDrawer.visibility == View.VISIBLE
            if (isShown) hideClipboardDrawer() else showClipboardDrawer()
        }

        btnCloseClipboard.setOnClickListener {
            hideClipboardDrawer()
        }

        btnClearClipboard.setOnClickListener {
            ClipboardRepository.clearUnpinned(this) {
                loadAndRenderClipboard()
                Toast.makeText(this, "Đã dọn dẹp các mục chưa ghim", Toast.LENGTH_SHORT).show()
            }
        }

        // Nút ⚙️ SETTINGS: Mở giao diện ứng dụng Vboard
        btnSettings.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(intent)
        }

        // Menu Chọn Chế Độ I/O (Chuẩn Gboard 2 thao tác)
        swipeKeyboardView.onOpenIOModeMenu = {
            showIOModeMenu()
        }

        swipeKeyboardView.onSwipeLivePreview = { liveWord ->
            val mode = swipeKeyboardView.currentIOMode
            if (mode == SwipeKeyboardView.IOMode.B60_TO_VN || mode == SwipeKeyboardView.IOMode.NO_ACCENT_TO_VN) {
                val candidates = generateCandidatesForWord(liveWord, mode)
                if (candidates.isNotEmpty()) {
                    showSuggestions(liveWord, candidates)
                }
            }
        }

        swipeKeyboardView.onHighlightSuggestion = { highlightIndex ->
            highlightSuggestionChip(highlightIndex)
        }

        swipeKeyboardView.onSwipeGesturePick = { swipedWord, pickIndex ->
            val mode = swipeKeyboardView.currentIOMode
            if (mode == SwipeKeyboardView.IOMode.B60_TO_VN || mode == SwipeKeyboardView.IOMode.NO_ACCENT_TO_VN) {
                val candidates = generateCandidatesForWord(swipedWord, mode)
                if (candidates.isNotEmpty()) {
                    val chosen = if (pickIndex in candidates.indices) candidates[pickIndex] else candidates.first()
                    UserHabitManager.recordSelection(swipedWord, chosen)
                    val ic = currentInputConnection
                    ic?.commitText("$chosen ", 1)
                    hideSuggestions()
                } else {
                    val ic = currentInputConnection
                    ic?.commitText("$swipedWord ", 1)
                    hideSuggestions()
                }
            } else {
                handleSwipedWord(swipedWord)
            }
        }

        swipeKeyboardView.onSwipeWord = { swipedWord ->
            handleSwipedWord(swipedWord)
        }

        btnCloseIomode.setOnClickListener {
            iomodeMenuOverlay.visibility = View.GONE
        }

        fun selectIOMode(mode: SwipeKeyboardView.IOMode) {
            swipeKeyboardView.setIOMode(mode)
            iomodeMenuOverlay.visibility = View.GONE
            android.widget.Toast.makeText(this, "Chế độ: ${mode.displayName} [${mode.badge}]", android.widget.Toast.LENGTH_SHORT).show()
        }

        itemIomodeVnVn.setOnClickListener { selectIOMode(SwipeKeyboardView.IOMode.VN_TO_VN) }
        itemIomodeB60Vn.setOnClickListener { selectIOMode(SwipeKeyboardView.IOMode.B60_TO_VN) }
        itemIomodeVnB60.setOnClickListener { selectIOMode(SwipeKeyboardView.IOMode.VN_TO_B60) }
        itemIomodeKdauVn.setOnClickListener { selectIOMode(SwipeKeyboardView.IOMode.NO_ACCENT_TO_VN) }
        itemIomodeB60B60.setOnClickListener { selectIOMode(SwipeKeyboardView.IOMode.B60_TO_B60) }

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
                SwipeKeyboardView.KeyboardLayer.GUIDE -> {
                    tvLayerStatus.text = if (swipeKeyboardView.isShiftActive) "📖 GUIDE (SHIFT)" else "📖 Tầng: Học tập"
                    tvLayerStatus.setTextColor(android.graphics.Color.parseColor("#58A6FF"))
                }
            }

            if (layer == SwipeKeyboardView.KeyboardLayer.GUIDE) {
                guideHudStrip.visibility = View.VISIBLE
                suggestionScroll.visibility = View.GONE
                updateGuideHud('g')
            } else {
                guideHudStrip.visibility = View.GONE
                mnemonicDialogOverlay.visibility = View.GONE
            }
        }

        // Lắng nghe phím học tập Guide
        swipeKeyboardView.onGuideKeyTapped = { ch ->
            updateGuideHud(ch)
        }

        swipeKeyboardView.onGuideKeyLongPressed = { ch ->
            showMnemonicCard(ch)
        }

        btnCloseMnemonic.setOnClickListener {
            mnemonicDialogOverlay.visibility = View.GONE
        }

        // Xử lý toàn bộ hành động từ bàn phím
        swipeKeyboardView.onAction = { action ->
            handleKeyboardAction(action)
        }
    }

    private fun showIOModeMenu() {
        if (!::iomodeMenuOverlay.isInitialized) return
        val current = swipeKeyboardView.currentIOMode
        checkIomodeVnVn.visibility = if (current == SwipeKeyboardView.IOMode.VN_TO_VN) View.VISIBLE else View.GONE
        checkIomodeB60Vn.visibility = if (current == SwipeKeyboardView.IOMode.B60_TO_VN) View.VISIBLE else View.GONE
        checkIomodeVnB60.visibility = if (current == SwipeKeyboardView.IOMode.VN_TO_B60) View.VISIBLE else View.GONE
        checkIomodeKdauVn.visibility = if (current == SwipeKeyboardView.IOMode.NO_ACCENT_TO_VN) View.VISIBLE else View.GONE
        checkIomodeB60B60.visibility = if (current == SwipeKeyboardView.IOMode.B60_TO_B60) View.VISIBLE else View.GONE
        iomodeMenuOverlay.visibility = View.VISIBLE
    }

    private fun getBase60ForWord(word: String): String {
        val clean = word.trim(',', '.', '!', '?', ';', ':', '-', '"', '\'')
        if (clean.isEmpty()) return ""
        val enc = VCompEngine.encodeWord(clean, bypassShortcut = true)
        val b60 = VCompEngine.timeToBase60(enc)
        return if (b60.isNotBlank() && b60 != enc && !b60.startsWith("[")) b60 else ""
    }

    private fun showSuggestions(rawWord: String, candidates: List<String>) {
        if (!::suggestionScroll.isInitialized || !::suggestionContainer.isInitialized) return
        lastSuggestedRawWord = rawWord
        currentSuggestions = candidates

        if (candidates.isEmpty()) {
            hideSuggestions()
            return
        }

        suggestionContainer.removeAllViews()
        val density = resources.displayMetrics.density

        // Render each candidate chip (Dual-Layer: Base60 code top-left, Vietnamese word main)
        candidates.forEachIndexed { index, word ->
            val isFirst = index == 0
            val b60Code = getBase60ForWord(word)

            val chipLayout = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = android.view.Gravity.CENTER_HORIZONTAL
                minimumWidth = (42 * density).toInt()
                setPadding((8 * density).toInt(), (2 * density).toInt(), (8 * density).toInt(), (3 * density).toInt())

                val bg = android.graphics.drawable.GradientDrawable().apply {
                    setColor(Color.parseColor("#21262D"))
                    cornerRadius = 6 * density
                    setStroke((1 * density).toInt(), if (isFirst) Color.parseColor("#388BFD") else Color.parseColor("#30363D"))
                }
                background = bg
                isClickable = true
                isFocusable = true

                // Dòng 1: Mã Base60 góc trên bên trái
                val tvSub = TextView(this@VSecretKeyboardService).apply {
                    text = if (b60Code.isNotEmpty()) b60Code else "•"
                    textSize = 9f
                    setTextColor(if (isFirst) Color.parseColor("#E3B341") else Color.parseColor("#8B949E"))
                    gravity = android.view.Gravity.START
                    setTypeface(android.graphics.Typeface.MONOSPACE, android.graphics.Typeface.BOLD)
                    isSingleLine = true
                    setPadding(0, 0, 0, 0)
                }
                val subParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    gravity = android.view.Gravity.START
                }
                addView(tvSub, subParams)

                // Dòng 2: Từ Tiếng Việt ở trung tâm
                val tvMain = TextView(this@VSecretKeyboardService).apply {
                    text = word
                    textSize = 13.5f
                    setTextColor(if (isFirst) Color.parseColor("#58A6FF") else Color.parseColor("#E6EDF3"))
                    if (isFirst) setTypeface(null, android.graphics.Typeface.BOLD)
                    gravity = android.view.Gravity.CENTER
                    isSingleLine = true
                    setPadding(0, 0, 0, 0)
                }
                val mainParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    gravity = android.view.Gravity.CENTER_HORIZONTAL
                }
                addView(tvMain, mainParams)

                setOnClickListener {
                    commitSuggestion(word)
                }
            }

            val params = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = (6 * density).toInt()
            }
            suggestionContainer.addView(chipLayout, params)
        }

        // Add raw word chip at the end
        val rawChip = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER_HORIZONTAL
            minimumWidth = (38 * density).toInt()
            setPadding((6 * density).toInt(), (2 * density).toInt(), (6 * density).toInt(), (3 * density).toInt())

            val bg = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#161B22"))
                cornerRadius = 6 * density
                setStroke((1 * density).toInt(), Color.parseColor("#30363D"))
            }
            background = bg
            isClickable = true
            isFocusable = true

            val tvSub = TextView(this@VSecretKeyboardService).apply {
                text = "raw"
                textSize = 8f
                setTextColor(Color.parseColor("#6E7681"))
                gravity = android.view.Gravity.START
                isSingleLine = true
                setPadding(0, 0, 0, 0)
            }
            val subParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.START
            }
            addView(tvSub, subParams)

            val tvMain = TextView(this@VSecretKeyboardService).apply {
                text = rawWord
                textSize = 12f
                setTextColor(Color.parseColor("#8B949E"))
                setTypeface(null, android.graphics.Typeface.ITALIC)
                gravity = android.view.Gravity.CENTER
                isSingleLine = true
            }
            val mainParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = android.view.Gravity.CENTER_HORIZONTAL
            }
            addView(tvMain, mainParams)

            setOnClickListener {
                commitSuggestion(rawWord)
            }
        }
        val rawParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply {
            marginEnd = (6 * density).toInt()
        }
        suggestionContainer.addView(rawChip, rawParams)

        suggestionScroll.visibility = View.VISIBLE
        suggestionScroll.post { suggestionScroll.smoothScrollTo(0, 0) }
    }

    private fun highlightSuggestionChip(highlightIndex: Int) {
        if (!::suggestionContainer.isInitialized) return
        val density = resources.displayMetrics.density
        for (i in 0 until suggestionContainer.childCount) {
            val chip = suggestionContainer.getChildAt(i) as? LinearLayout ?: continue
            val tvSub = chip.getChildAt(0) as? TextView
            val tvMain = chip.getChildAt(1) as? TextView
            val isHighlighted = (i == highlightIndex)
            val isFirst = (i == 0)

            if (isHighlighted) {
                tvSub?.setTextColor(Color.parseColor("#D2FFE0"))
                tvMain?.setTextColor(Color.WHITE)
                val bg = android.graphics.drawable.GradientDrawable().apply {
                    setColor(Color.parseColor("#238636")) // Xanh lục nổi bật báo hiệu đang chọn
                    cornerRadius = 6 * density
                    setStroke((2 * density).toInt(), Color.parseColor("#3FB950"))
                }
                chip.background = bg
            } else {
                val isRaw = (i == suggestionContainer.childCount - 1) && (i > 0)
                if (isRaw) {
                    tvSub?.setTextColor(Color.parseColor("#6E7681"))
                    tvMain?.setTextColor(Color.parseColor("#8B949E"))
                    val bg = android.graphics.drawable.GradientDrawable().apply {
                        setColor(Color.parseColor("#161B22"))
                        cornerRadius = 6 * density
                        setStroke((1 * density).toInt(), Color.parseColor("#30363D"))
                    }
                    chip.background = bg
                } else {
                    tvSub?.setTextColor(if (isFirst) Color.parseColor("#E3B341") else Color.parseColor("#8B949E"))
                    tvMain?.setTextColor(if (isFirst) Color.parseColor("#58A6FF") else Color.parseColor("#E6EDF3"))
                    val bg = android.graphics.drawable.GradientDrawable().apply {
                        setColor(Color.parseColor("#21262D"))
                        cornerRadius = 6 * density
                        setStroke((1 * density).toInt(), if (isFirst) Color.parseColor("#388BFD") else Color.parseColor("#30363D"))
                    }
                    chip.background = bg
                }
            }
        }
    }

    private fun hideSuggestions() {
        if (!::suggestionScroll.isInitialized) return
        suggestionScroll.visibility = View.GONE
        suggestionContainer.removeAllViews()
        currentSuggestions = emptyList()
        lastSuggestedRawWord = ""
        lastAutoCommittedWord = ""
    }

    private fun commitSuggestion(word: String) {
        val ic = currentInputConnection ?: return
        val textBefore = ic.getTextBeforeCursor(50, 0)?.toString() ?: ""

        if (lastAutoCommittedWord.isNotEmpty()) {
            val targetWithSpace = "$lastAutoCommittedWord "
            if (textBefore.endsWith(targetWithSpace)) {
                ic.deleteSurroundingText(targetWithSpace.length, 0)
            } else if (textBefore.endsWith(lastAutoCommittedWord)) {
                ic.deleteSurroundingText(lastAutoCommittedWord.length, 0)
            }
            lastAutoCommittedWord = ""
        } else if (lastSuggestedRawWord.isNotEmpty() && textBefore.endsWith(lastSuggestedRawWord)) {
            ic.deleteSurroundingText(lastSuggestedRawWord.length, 0)
        }

        ic.commitText("$word ", 1)
        if (lastSuggestedRawWord.isNotEmpty() && word != lastSuggestedRawWord) {
            UserHabitManager.recordSelection(lastSuggestedRawWord, word)
        }
        hideSuggestions()
    }

    private fun handleSwipedWord(word: String) {
        if (word.isBlank()) return
        val ic = currentInputConnection ?: return

        when (val mode = swipeKeyboardView.currentIOMode) {
            SwipeKeyboardView.IOMode.B60_TO_VN,
            SwipeKeyboardView.IOMode.NO_ACCENT_TO_VN -> {
                val candidates = generateCandidatesForWord(word, mode)
                if (candidates.isNotEmpty()) {
                    val top = candidates.first()
                    ic.commitText("$top ", 1)
                    lastAutoCommittedWord = top
                    lastSuggestedRawWord = word
                    UserHabitManager.recordSelection(word, top)
                    showSuggestions(word, candidates)
                } else {
                    ic.commitText("$word ", 1)
                    hideSuggestions()
                }
            }
            SwipeKeyboardView.IOMode.VN_TO_B60 -> {
                val enc = VCompEngine.encodeWord(word, bypassShortcut = true)
                val b60 = VCompEngine.timeToBase60(enc)
                val out = if (b60.isNotBlank() && b60 != enc) b60 else word
                ic.commitText("$out ", 1)
                hideSuggestions()
            }
            SwipeKeyboardView.IOMode.B60_TO_B60 -> {
                ic.commitText("$word ", 1)
                hideSuggestions()
            }
            SwipeKeyboardView.IOMode.VN_TO_VN -> {
                val out = if (activeHexMode != '0') transcodeText(word) else word
                ic.commitText("$out ", 1)
                hideSuggestions()
            }
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
                    if (currentSuggestions.isNotEmpty()) {
                        val top = currentSuggestions.first()
                        commitSuggestion(top)
                        return
                    }
                    val textBefore = ic.getTextBeforeCursor(100, 0)?.toString() ?: ""
                    val match = Regex("([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)$").find(textBefore)
                    if (match != null) {
                        val lastWord = match.value
                        val transformed = applyIOModeTransform(lastWord, swipeKeyboardView.currentIOMode)
                        if (transformed != lastWord) {
                            ic.deleteSurroundingText(lastWord.length, 0)
                            ic.commitText(transformed, 1)
                        }
                    }
                    if (activeHexMode != '2' && activeHexMode != 'd' && activeHexMode != 'c') {
                        ic.commitText(" ", 1)
                    }
                    hideSuggestions()
                } else if (action.text.isNotEmpty()) {
                    lastAutoCommittedWord = ""
                    ic.commitText(action.text, 1)
                    val mode = swipeKeyboardView.currentIOMode
                    if (mode == SwipeKeyboardView.IOMode.B60_TO_VN || mode == SwipeKeyboardView.IOMode.NO_ACCENT_TO_VN) {
                        val textBefore = ic.getTextBeforeCursor(15, 0)?.toString() ?: ""
                        val match = Regex("([a-zA-Z0-9]+)$").find(textBefore)
                        val word = match?.value ?: ""
                        val minLen = 1
                        val maxLen = if (mode == SwipeKeyboardView.IOMode.B60_TO_VN) 4 else 12
                        if (word.length in minLen..maxLen) {
                            val candidates = generateCandidatesForWord(word, mode)
                            if (candidates.isNotEmpty()) {
                                showSuggestions(word, candidates)
                            } else {
                                hideSuggestions()
                            }
                        } else {
                            hideSuggestions()
                        }
                    }
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
                hideSuggestions()
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

            SwipeKeyboardView.KeyboardAction.OpenGuideLayer -> {
                swipeKeyboardView.setLayer(SwipeKeyboardView.KeyboardLayer.GUIDE)
            }
        }
    }

    private fun updateGuideHud(ch: Char) {
        if (!::guideHudStrip.isInitialized) return
        val compact = MnemonicDatabase.getCompactHudSummary(ch)

        if (compact != null) {
            tvGuideHudLine1.text = android.text.Html.fromHtml(compact.first, android.text.Html.FROM_HTML_MODE_LEGACY)
            tvGuideHudLine2.text = android.text.Html.fromHtml(compact.second, android.text.Html.FROM_HTML_MODE_LEGACY)
        } else {
            val con = MnemonicDatabase.getConsonant(ch)
            val conText = if (con.isNotEmpty()) " (Phụ âm: $con)" else ""
            tvGuideHudLine1.text = android.text.Html.fromHtml("<font color='#58A6FF'><b>[$ch]</b></font>$conText", android.text.Html.FROM_HTML_MODE_LEGACY)
            tvGuideHudLine2.text = android.text.Html.fromHtml("<font color='#FFA657'>💡 Chạm phím chữ/số để học Base60 • Giữ phím để xem câu chuyện</font>", android.text.Html.FROM_HTML_MODE_LEGACY)
        }
        guideHudStrip.visibility = View.VISIBLE
    }

    private fun showMnemonicCard(ch: Char) {
        if (!::mnemonicDialogOverlay.isInitialized) return
        val item = MnemonicDatabase.get(ch) ?: return
        val conLower = MnemonicDatabase.getConsonant(item.lower)
        val conUpper = MnemonicDatabase.getConsonant(item.upper)

        tvMnemonicTitle.text = "📖 CẶP [ ${item.upper} / ${item.lower} ] • Phụ âm: ${item.lower}($conLower) / ${item.upper}($conUpper)"

        // Nhánh Thường
        val rLower = item.lowerRhymes.filter { it.isNotEmpty() }.joinToString(" • ")
        tvMnemonicLowerTitle.text = "Nhánh Thường: [ ${item.lower} ] (Base60 #${item.lowerIdx})"
        tvMnemonicLowerPhrase.text = "➔ ${item.lowerPhrase}"
        tvMnemonicLowerRhymes.text = "Vần: $rLower"

        // Nhánh HOA
        val rUpper = item.upperRhymes.filter { it.isNotEmpty() }.joinToString(" • ")
        tvMnemonicUpperTitle.text = "Nhánh HOA (Shift): [ ${item.upper} ] (Base60 #${item.upperIdx})"
        tvMnemonicUpperPhrase.text = "➔ ${item.upperPhrase}"
        tvMnemonicUpperRhymes.text = "Vần: $rUpper"

        // Story (Highlight các từ khóa thần chú viết hoa đổi màu)
        val highlighted = MnemonicDatabase.getHighlightedStory(item)
        tvMnemonicStory.text = android.text.Html.fromHtml(highlighted, android.text.Html.FROM_HTML_MODE_LEGACY)

        // Samples
        tvMnemonicSamples.text = item.samples.joinToString("   •   ") { "${it.word} [${it.code}]" }

        mnemonicDialogOverlay.visibility = View.VISIBLE
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
        if (::clipboardDrawer.isInitialized) {
            clipboardDrawer.visibility = View.GONE
        }
        hideSuggestions()
        capturePrimaryClip()
    }

    override fun onDestroy() {
        removeClipboardListener()
        HandsFreeVoiceService.onListeningStateChanged = null
        if (instance == this) {
            instance = null
        }
        super.onDestroy()
    }

    // ========================================================
    // QUẢN LÝ BỘ NHỚ TẠM ĐA NĂNG (MULTI-CLIPBOARD ENGINE)
    // ========================================================
    private fun setupClipboardListener() {
        try {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager ?: return
            val listener = ClipboardManager.OnPrimaryClipChangedListener {
                capturePrimaryClip()
            }
            cm.addPrimaryClipChangedListener(listener)
            clipChangedListener = listener
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun removeClipboardListener() {
        try {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager ?: return
            clipChangedListener?.let { cm.removePrimaryClipChangedListener(it) }
            clipChangedListener = null
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun capturePrimaryClip() {
        try {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager ?: return
            val clip = cm.primaryClip
            if (clip != null && clip.itemCount > 0) {
                val text = clip.getItemAt(0)?.text?.toString()
                if (!text.isNullOrBlank()) {
                    ClipboardRepository.saveCopiedText(this, text)
                }
            }
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun showClipboardDrawer() {
        if (!::clipboardDrawer.isInitialized) return
        clipboardDrawer.visibility = View.VISIBLE
        loadAndRenderClipboard()
    }

    private fun hideClipboardDrawer() {
        if (!::clipboardDrawer.isInitialized) return
        clipboardDrawer.visibility = View.GONE
    }

    private fun loadAndRenderClipboard() {
        ClipboardRepository.loadAll(this) { items ->
            if (!::containerClipboardItems.isInitialized) return@loadAll
            containerClipboardItems.removeAllViews()
            val density = resources.displayMetrics.density

            tvClipboardTitle.text = "📋 BỘ NHỚ TẠM (${items.size} mục)"

            if (items.isEmpty()) {
                val emptyTv = TextView(this).apply {
                    text = "📋 Chưa có nội dung trong bộ nhớ tạm.\nMọi văn bản bạn sao chép trên điện thoại sẽ tự động xuất hiện ở đây!"
                    textSize = 13f
                    setTextColor(Color.parseColor("#8B949E"))
                    gravity = Gravity.CENTER
                    val pad = (24 * density).toInt()
                    setPadding(pad, pad, pad, pad)
                }
                containerClipboardItems.addView(emptyTv)
                return@loadAll
            }

            val pinnedItems = items.filter { it.isPinned }
            val recentItems = items.filter { !it.isPinned }

            // 1. Nhóm Đã Ghim
            if (pinnedItems.isNotEmpty()) {
                val tvHeaderPinned = TextView(this).apply {
                    text = "📌 ĐÃ GHIM (${pinnedItems.size})"
                    textSize = 11.5f
                    setTextColor(Color.parseColor("#E3B341"))
                    setTypeface(null, Typeface.BOLD)
                    setPadding((6 * density).toInt(), (4 * density).toInt(), (6 * density).toInt(), (4 * density).toInt())
                }
                containerClipboardItems.addView(tvHeaderPinned)

                for (item in pinnedItems) {
                    containerClipboardItems.addView(createClipboardItemView(item, density))
                }
            }

            // 2. Nhóm Gần Đây
            if (recentItems.isNotEmpty()) {
                val tvHeaderRecent = TextView(this).apply {
                    text = "🕒 GẦN ĐÂY (${recentItems.size})"
                    textSize = 11.5f
                    setTextColor(Color.parseColor("#58A6FF"))
                    setTypeface(null, Typeface.BOLD)
                    setPadding((6 * density).toInt(), if (pinnedItems.isNotEmpty()) (10 * density).toInt() else (4 * density).toInt(), (6 * density).toInt(), (4 * density).toInt())
                }
                containerClipboardItems.addView(tvHeaderRecent)

                for (item in recentItems) {
                    containerClipboardItems.addView(createClipboardItemView(item, density))
                }
            }
        }
    }

    private fun createClipboardItemView(item: ClipboardItem, density: Float): View {
        val itemLayout = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val padH = (12 * density).toInt()
            val padV = (8 * density).toInt()
            setPadding(padH, padV, padH, padV)

            val bg = GradientDrawable().apply {
                setColor(if (item.isPinned) Color.parseColor("#1F242C") else Color.parseColor("#161B22"))
                cornerRadius = 8 * density
                val strokeColor = if (item.isPinned) Color.parseColor("#E3B341") else Color.parseColor("#30363D")
                setStroke((1 * density).toInt(), strokeColor)
            }
            background = bg
            isClickable = true
            isFocusable = true

            setOnClickListener {
                val ic = currentInputConnection
                if (ic != null) {
                    ic.commitText(item.text, 1)
                    val shortPreview = if (item.text.length > 20) item.text.take(20) + "..." else item.text
                    Toast.makeText(this@VSecretKeyboardService, "Đã dán: \"$shortPreview\"", Toast.LENGTH_SHORT).show()
                }
            }
        }

        val tvContent = TextView(this).apply {
            text = item.text
            textSize = 13f
            setTextColor(Color.parseColor("#E6EDF3"))
            maxLines = 3
            ellipsize = android.text.TextUtils.TruncateAt.END
            setPadding(0, 0, (8 * density).toInt(), 0)
        }
        val contentParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        itemLayout.addView(tvContent, contentParams)

        // Actions: Pin & Delete
        val actionsLayout = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val btnPin = TextView(this).apply {
            text = if (item.isPinned) "📌" else "📍"
            textSize = 14f
            val pad = (6 * density).toInt()
            setPadding(pad, pad, pad, pad)
            setOnClickListener {
                ClipboardRepository.togglePin(this@VSecretKeyboardService, item) {
                    loadAndRenderClipboard()
                }
            }
        }
        actionsLayout.addView(btnPin)

        val btnDelete = TextView(this).apply {
            text = "🗑️"
            textSize = 14f
            val pad = (6 * density).toInt()
            setPadding(pad, pad, pad, pad)
            setOnClickListener {
                ClipboardRepository.deleteItem(this@VSecretKeyboardService, item) {
                    loadAndRenderClipboard()
                }
            }
        }
        actionsLayout.addView(btnDelete)

        itemLayout.addView(actionsLayout)

        val params = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply {
            bottomMargin = (6 * density).toInt()
        }
        itemLayout.layoutParams = params

        return itemLayout
    }
}
