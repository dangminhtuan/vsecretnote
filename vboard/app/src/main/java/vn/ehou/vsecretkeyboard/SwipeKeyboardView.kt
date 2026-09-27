package vn.ehou.vsecretkeyboard

import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.AttributeSet
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.View
import kotlin.math.abs
import kotlin.math.hypot

/**
 * Bàn phím ảo vBoard 5 hàng:
 * 1. NORMAL: Tầng gõ ký tự gốc (kèm Shift hàng số Gboard !@#$%^&*() và chữ hoa)
 * 2. MODE: Tầng 15 Mode Cơ số 16 (0..e) + 5 tính năng bôi đen chuyên sâu (bao gồm bôi đen đầu câu & Paste)
 * 3. VOWEL_SELECTOR: Tầng tiếng Việt thông minh [ớ] (d=đ, s=Đ, 10 cụm nguyên âm kép, Shift ký hiệu mở rộng)
 * 4. VOWEL_MATRIX: Ma trận biến thể dấu & viết hoa của nguyên âm đã chọn
 */
class SwipeKeyboardView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    enum class KeyboardLayer {
        NORMAL,
        MODE,
        VOWEL_SELECTOR,
        VOWEL_MATRIX,
        MACRO_PALETTE,
        GUIDE,
        SEARCH
    }

    enum class IOMode(val badge: String, val displayName: String) {
        VN_TO_VN("VN ➔ VN", "Tiếng Việt chuẩn"),
        B60_TO_VN("B60 ➔ VN", "Gõ Base60 ra Tiếng Việt"),
        VN_TO_B60("VN ➔ B60", "Gõ Tiếng Việt ra Base60"),
        NO_ACCENT_TO_VN("K.Dấu ➔ VN", "Gõ không dấu tự thêm dấu"),
        B60_TO_B60("B60 ➔ B60", "Gõ Base60 giữ nguyên Base60")
    }

    sealed class KeyboardAction {
        data class CommitText(val text: String) : KeyboardAction()
        data class WrapText(val open: String, val close: String) : KeyboardAction()
        object Backspace : KeyboardAction()
        object DeleteForward : KeyboardAction()
        object DeleteWordBackward : KeyboardAction()
        object ClearAll : KeyboardAction()
        object ToggleCase : KeyboardAction()
        object Undo : KeyboardAction()
        object Redo : KeyboardAction()
        object SelectAll : KeyboardAction()
        object SelectToStart : KeyboardAction()
        object SelectToEnd : KeyboardAction()
        object SelectParagraph : KeyboardAction()
        object SelectToEndOfSentence : KeyboardAction()
        object SelectToStartOfSentence : KeyboardAction()
        object Paste : KeyboardAction()
        object MoveLeft : KeyboardAction()
        object MoveRight : KeyboardAction()
        object MoveUp : KeyboardAction()
        object MoveDown : KeyboardAction()
        object MoveHome : KeyboardAction()
        object MoveEnd : KeyboardAction()
        object Search : KeyboardAction()
        object Enter : KeyboardAction()
        object OpenGuideLayer : KeyboardAction()
        data class SwitchMode(val hexKey: Char, val modeName: String, val icon: String) : KeyboardAction()
        data class CommitRhymeTutor(val replacementText: String, val prefixLength: Int) : KeyboardAction()
    }

    data class GuideInfo(
        val char: Char,
        val consonant: String,
        val rhyme1: String, // Góc trên-trái (Bảng 1)
        val rhyme2: String, // Góc trên-phải (Bảng 2)
        val rhyme3: String, // Góc dưới-trái (Bảng 3)
        val tone: String    // Góc dưới-phải (Dấu thanh)
    )

    private data class KeyModel(
        val id: String,
        val baseLabel: String,
        val displayChar: String,
        val subLabel: String? = null,
        val action: KeyboardAction,
        val bgHex: String = "#2D333B",
        val textHex: String = "#E6EDF3",
        val isSpecial: Boolean = false,
        val textSizeSp: Float = 17f,
        val guideInfo: GuideInfo? = null,
        val chipDef: ChipKeyDef? = null
    )

    var currentLayer: KeyboardLayer = KeyboardLayer.NORMAL
        private set

    var isShiftActive: Boolean = false
        private set

    var isCapsLock: Boolean = false
        private set

    var isKeepVowelLayer: Boolean = false
        private set

    var isKeepModeLayer: Boolean = false

    var currentIOMode: IOMode = IOMode.VN_TO_VN
        private set

    // Toggle hiển thị Hàng 0 (Ký hiệu mở rộng):
    var isRowSymbolsVisible: Boolean = true
        private set

    // Trạng thái Chế độ Tìm kiếm / Soi vần (Spotlight Search):
    var searchQuery: String = ""
        private set
    var isFilter2c: Boolean = false
        private set
    var isFilter3c: Boolean = false
        private set
    var isSearchMatchAnywhere: Boolean = false
        private set
    var isSearchHiddenRhymesEnabled: Boolean = true
        private set

    var isNativeSearchContext: Boolean = false
        set(value) {
            if (field != value) {
                field = value
                if (width > 0 && height > 0) {
                    calculateKeys(width, height)
                    invalidate()
                }
            }
        }

    fun toggleRowSymbols(): Boolean {
        isRowSymbolsVisible = !isRowSymbolsVisible
        calculateKeys(width, height)
        invalidate()
        return isRowSymbolsVisible
    }

    fun cycleIOMode(): IOMode {
        val modes = IOMode.values()
        val nextIdx = (currentIOMode.ordinal + 1) % modes.size
        currentIOMode = modes[nextIdx]
        calculateKeys(width, height)
        invalidate()
        return currentIOMode
    }

    fun setIOMode(mode: IOMode) {
        currentIOMode = mode
        calculateKeys(width, height)
        invalidate()
    }

    fun isCompassInputMode(): Boolean {
        return currentIOMode == IOMode.VN_TO_VN || currentIOMode == IOMode.VN_TO_B60
    }

    private val initialConsonants = setOf(
        "b", "c", "ch", "d", "đ", "g", "gh", "gi", "h", "k", "kh",
        "l", "m", "n", "ng", "ngh", "nh", "p", "ph", "qu", "r",
        "s", "t", "th", "tr", "v", "x"
    )

    private fun isInitialConsonant(text: String): Boolean {
        return text.lowercase().trim() in initialConsonants
    }

    private var lastShiftTapTime: Long = 0L
    private var lastVowelTapTime: Long = 0L
    private var lastModeTapTime: Long = 0L

    // Flick Compass HUD state:
    private var isFlicking: Boolean = false
    private var currentFlickDir: Int = -1
    private var currentFlickEngineDir: FlickDirection? = null
    private var currentFlickDx: Float = 0f
    private var currentFlickDy: Float = 0f

    // Dynamic Backspace word slide:
    private var isBkspSliding: Boolean = false
    private var bkspWordsDeleted: Int = 0

    var isVowelSymbolShift: Boolean = false
        private set

    var activeVowelKey: String = "u"
        private set

    var onAction: ((KeyboardAction) -> Unit)? = null
    var onLayerChanged: ((KeyboardLayer) -> Unit)? = null
    var onOpenIOModeMenu: (() -> Unit)? = null
    var onSwipeWord: ((String) -> Unit)? = null
    var onSwipeLivePreview: ((String) -> Unit)? = null
    var onSwipeGesturePick: ((word: String, pickIndex: Int) -> Unit)? = null
    var onHighlightSuggestion: ((pickIndex: Int) -> Unit)? = null
    var onGuideKeyTapped: ((Char) -> Unit)? = null
    var onGuideKeyLongPressed: ((Char) -> Unit)? = null

    private var lastLiveAnalysisTime: Long = 0L
    private var lastLivePreviewWord: String = ""

    // Swipe Trail & Tracking cho các chế độ ngoài VN_TO_VN:
    private var isSwiping: Boolean = false
    private val swipePoints = mutableListOf<Point>()
    private val swipePathPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#58A6FF")
        style = Paint.Style.STROKE
        strokeWidth = 10f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val swipeGlowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#388BFD")
        alpha = 90
        style = Paint.Style.STROKE
        strokeWidth = 20f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val bkspPoints = mutableListOf<Point>()
    private val bkspTrailPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#F85149")
        style = Paint.Style.STROKE
        strokeWidth = 9f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val bkspGlowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#DA3633")
        alpha = 85
        style = Paint.Style.STROKE
        strokeWidth = 19f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    var activeMacroKey: String = ""
        private set

    // Touch & Visual state
    private val keyRects = mutableMapOf<String, RectF>()
    private val keyModels = mutableMapOf<String, KeyModel>()
    private val letterKeyCenters = mutableMapOf<Char, Point>()
    private var pressedKeyId: String? = null

    // Hold & Gesture Tracking
    private var touchStartX = 0f
    private var touchStartY = 0f
    private var lastSpaceX = 0f
    private var isSpaceSliding = false
    private var didLongPress = false
    private val holdHandler = Handler(Looper.getMainLooper())
    private var holdRunnable: Runnable? = null

    // Paints
    private val keyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val keyBorderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 2.5f
        color = Color.parseColor("#373E47")
    }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        color = Color.parseColor("#E6EDF3")
    }
    private val subTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.LEFT
        color = Color.parseColor("#8B949E")
        textSize = 22f
    }

    // Chip Slot Paints (Giao diện 5 slot trên từng phím chip)
    private val chipTlPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.LEFT
        color = Color.parseColor("#3FB950") // Xanh lá: Vần 1
        isFakeBoldText = true
    }
    private val chipTrPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.RIGHT
        color = Color.parseColor("#BC8CFF") // Tím: Base60
        isFakeBoldText = true
    }
    private val chipBlPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.LEFT
        color = Color.parseColor("#39C5BB") // Cyan: sc2
    }
    private val chipBrPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.RIGHT
        color = Color.parseColor("#FFA657") // Hổ phách: sc1
    }
    private val chipCenterPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        color = Color.parseColor("#FFFFFF")
        isFakeBoldText = true
    }

    // Flick Compass HUD Paints
    private val hudBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.argb(242, 13, 17, 23)
    }
    private val hudBorderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 2.5f
        color = Color.parseColor("#388BFD")
    }
    private val hudCenterPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#21262D")
    }
    private val hudActivePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#1F6FEB")
    }
    private val hudActiveBorderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 2f
        color = Color.parseColor("#FFFFFF")
    }
    private val hudInactivePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#161B22")
    }
    private val hudRayPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 3f
        color = Color.parseColor("#58A6FF")
    }
    private val hudTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
    }

    // Guide Layer Paints (4 góc + Phụ âm giữa)
    private val guideConsonantPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        color = Color.parseColor("#3FB950")
        isFakeBoldText = true
    }
    private val guideRhyme1Paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.LEFT
        color = Color.parseColor("#E3B341")
        isFakeBoldText = true
    }
    private val guideRhyme2Paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.RIGHT
        color = Color.parseColor("#BC8CFF")
        isFakeBoldText = true
    }
    private val guideRhyme3Paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.LEFT
        color = Color.parseColor("#FFA657")
        isFakeBoldText = true
    }
    private val guideTonePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.RIGHT
        color = Color.parseColor("#F778BA")
        isFakeBoldText = true
    }

    // Rhyme Tutor (Đèn chỉ điểm vần & Học thuộc phím vi mạch):
    var rhymeTutorHighlights: Map<String, String> = emptyMap()
        private set
    var rhymeTutorPrefix: String = ""
        private set

    private val rhymeTutorBorderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 3f
        color = Color.parseColor("#F1E05A") // Vàng Neon rực rỡ
    }
    private val rhymeTutorTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFD33D")
        isFakeBoldText = true
    }

    fun setRhymeTutor(highlights: Map<String, String>, prefix: String) {
        if (rhymeTutorHighlights != highlights || rhymeTutorPrefix != prefix) {
            rhymeTutorHighlights = highlights
            rhymeTutorPrefix = prefix
            invalidate()
        }
    }

    fun clearRhymeTutor() {
        if (rhymeTutorHighlights.isNotEmpty() || rhymeTutorPrefix.isNotEmpty()) {
            rhymeTutorHighlights = emptyMap()
            rhymeTutorPrefix = ""
            invalidate()
        }
    }

    // Constants
    private val shiftSymbolsRow1 = listOf("!", "@", "#", "$", "%", "^", "&", "*", "(", ")")

    init {
        isHapticFeedbackEnabled = true
    }

    fun setLayer(layer: KeyboardLayer) {
        currentLayer = layer
        if (layer != KeyboardLayer.NORMAL && layer != KeyboardLayer.GUIDE && layer != KeyboardLayer.SEARCH) {
            if (!isCapsLock) isShiftActive = false
        }
        if (layer != KeyboardLayer.VOWEL_SELECTOR) {
            isVowelSymbolShift = false
        }
        if (layer != KeyboardLayer.SEARCH) {
            searchQuery = ""
            isFilter2c = false
            isFilter3c = false
            isSearchMatchAnywhere = false
        }
        calculateKeys(width, height)
        invalidate()
        onLayerChanged?.invoke(currentLayer)
    }

    fun toggleSearchLayer() {
        if (currentLayer == KeyboardLayer.SEARCH) {
            setLayer(KeyboardLayer.NORMAL)
        } else {
            setLayer(KeyboardLayer.SEARCH)
        }
    }

    fun toggleModeLayer() {
        val now = SystemClock.uptimeMillis()
        if (now - lastModeTapTime < 350) {
            // Double tap -> Keep Mode!
            isKeepModeLayer = true
            setLayer(KeyboardLayer.MODE)
            performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        } else {
            if (currentLayer == KeyboardLayer.MODE) {
                isKeepModeLayer = false
                setLayer(KeyboardLayer.NORMAL)
            } else {
                isKeepModeLayer = false
                setLayer(KeyboardLayer.MODE)
            }
        }
        lastModeTapTime = now
    }

    fun toggleVowelSelector() {
        val now = SystemClock.uptimeMillis()
        if (now - lastVowelTapTime < 350) {
            // Double tap -> Keep Typing [ớ]!
            isKeepVowelLayer = true
            setLayer(KeyboardLayer.VOWEL_SELECTOR)
            performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        } else {
            if (currentLayer == KeyboardLayer.VOWEL_SELECTOR || currentLayer == KeyboardLayer.VOWEL_MATRIX) {
                isKeepVowelLayer = false
                setLayer(KeyboardLayer.NORMAL)
            } else {
                isKeepVowelLayer = false
                setLayer(KeyboardLayer.VOWEL_SELECTOR)
            }
        }
        lastVowelTapTime = now
    }

    fun toggleShift() {
        val now = SystemClock.uptimeMillis()
        if (now - lastShiftTapTime < 350) {
            // Double tap -> Caps Lock!
            isCapsLock = !isCapsLock
            isShiftActive = isCapsLock
            performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        } else {
            if (isCapsLock) {
                isCapsLock = false
                isShiftActive = false
            } else {
                isShiftActive = !isShiftActive
            }
        }
        lastShiftTapTime = now
        calculateKeys(width, height)
        invalidate()
        onLayerChanged?.invoke(currentLayer)
    }

    fun toggleVowelShift() {
        isVowelSymbolShift = !isVowelSymbolShift
        calculateKeys(width, height)
        invalidate()
    }

    fun openVowelMatrix(key: String) {
        if (VowelDatabase.DATA.containsKey(key)) {
            activeVowelKey = key
            setLayer(KeyboardLayer.VOWEL_MATRIX)
        } else {
            onAction?.invoke(KeyboardAction.CommitText(key))
            setLayer(KeyboardLayer.NORMAL)
        }
    }

    fun backToVowelSelector() {
        setLayer(KeyboardLayer.VOWEL_SELECTOR)
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        calculateKeys(w, h)
    }

    private fun calculateKeys(width: Int, height: Int) {
        if (width <= 0 || height <= 0) return
        keyRects.clear()
        keyModels.clear()

        val totalRows = when {
            (currentLayer == KeyboardLayer.NORMAL || currentLayer == KeyboardLayer.SEARCH || currentLayer == KeyboardLayer.MODE) && isRowSymbolsVisible -> 6f
            currentLayer == KeyboardLayer.VOWEL_SELECTOR && !isVowelSymbolShift && isRowSymbolsVisible -> 6f
            else -> 5f
        }
        val rowHeight = height / totalRows
        val padding = 4f

        when (currentLayer) {
            KeyboardLayer.NORMAL -> calculateNormalKeys(width, rowHeight, padding)
            KeyboardLayer.MODE -> calculateModeKeys(width, rowHeight, padding)
            KeyboardLayer.VOWEL_SELECTOR -> {
                if (isVowelSymbolShift) {
                    calculateVowelShiftSymbols(width, rowHeight, padding)
                } else {
                    calculateVowelSelectorKeys(width, rowHeight, padding)
                }
            }
            KeyboardLayer.VOWEL_MATRIX -> calculateVowelMatrixKeys(width, rowHeight, padding)
            KeyboardLayer.MACRO_PALETTE -> calculateMacroKeys(width, rowHeight, padding)
            KeyboardLayer.GUIDE -> calculateGuideKeys(width, rowHeight, padding)
            KeyboardLayer.SEARCH -> calculateSearchKeys(width, rowHeight, padding)
        }

        // Cập nhật tọa độ tâm các phím chữ cái phục vụ thuật toán Swipe Lexicon-Matching
        letterKeyCenters.clear()
        for ((id, rect) in keyRects) {
            val model = keyModels[id]
            if (model != null && !model.isSpecial && model.displayChar.length == 1) {
                val ch = model.displayChar.lowercase().first()
                if (ch in 'a'..'z') {
                    letterKeyCenters[ch] = Point(rect.centerX(), rect.centerY())
                }
            }
        }
    }

    private fun createGuideInfo(ch: Char): GuideInfo {
        val item = MnemonicDatabase.get(ch)
        val isUpper = (ch.isUpperCase() || (item != null && ch == item.upper))
        val rhymes = if (item != null) {
            if (isUpper) item.upperRhymes else item.lowerRhymes
        } else emptyList()
        val r1 = rhymes.getOrElse(0) { "" }
        val r2 = rhymes.getOrElse(1) { "" }
        val r3 = rhymes.getOrElse(2) { "" }
        val consonant = MnemonicDatabase.getSmartConsonantLabel(ch)
        val tone = MnemonicDatabase.getTone(ch)
        return GuideInfo(ch, consonant, r1, r2, r3, tone)
    }

    private fun calculateGuideKeys(width: Int, rowHeight: Float, padding: Float) {
        val w10 = width / 10f

        // Hàng 1 (10 phím): 1..0 (Cặp số trong Mnemonic)
        val r1Nums = listOf('1', '2', '3', '4', '5', '6', '7', '8', '9', '0')
        for (i in r1Nums.indices) {
            val baseChar = r1Nums[i]
            val item = MnemonicDatabase.get(baseChar)
            val displayChar = if (isShiftActive || isCapsLock) {
                item?.upper?.toString() ?: baseChar.toString()
            } else {
                baseChar.toString()
            }
            val targetChar = displayChar[0]
            val gInfo = createGuideInfo(targetChar)
            val k = KeyModel(
                id = "guide_0_$i",
                baseLabel = baseChar.toString(),
                displayChar = displayChar,
                action = KeyboardAction.CommitText(displayChar),
                bgHex = "#21262D",
                textHex = "#E6EDF3",
                guideInfo = gInfo
            )
            keyRects[k.id] = RectF(i * w10 + padding, padding, (i + 1) * w10 - padding, rowHeight - padding)
            keyModels[k.id] = k
        }

        // Hàng 2 (10 phím): QWERTY
        val rawR2 = listOf('q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p')
        for (i in rawR2.indices) {
            val baseChar = rawR2[i]
            val item = MnemonicDatabase.get(baseChar)
            val displayChar = if (isShiftActive || isCapsLock) {
                item?.upper?.toString() ?: baseChar.uppercase()
            } else {
                baseChar.toString()
            }
            val targetChar = displayChar[0]
            val gInfo = createGuideInfo(targetChar)
            val k = KeyModel(
                id = "guide_1_$i",
                baseLabel = baseChar.toString(),
                displayChar = displayChar,
                action = KeyboardAction.CommitText(displayChar),
                bgHex = "#21262D",
                textHex = "#FFFFFF",
                guideInfo = gInfo
            )
            keyRects[k.id] = RectF(i * w10 + padding, rowHeight + padding, (i + 1) * w10 - padding, rowHeight * 2 - padding)
            keyModels[k.id] = k
        }

        // Hàng 3 (9 phím): ASDFGHJKL
        val rawR3 = listOf('a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l')
        val offset3 = w10 * 0.5f
        for (i in rawR3.indices) {
            val baseChar = rawR3[i]
            val item = MnemonicDatabase.get(baseChar)
            val displayChar = if (isShiftActive || isCapsLock) {
                item?.upper?.toString() ?: baseChar.uppercase()
            } else {
                baseChar.toString()
            }
            val targetChar = displayChar[0]
            val gInfo = createGuideInfo(targetChar)
            val k = KeyModel(
                id = "guide_2_$i",
                baseLabel = baseChar.toString(),
                displayChar = displayChar,
                action = KeyboardAction.CommitText(displayChar),
                bgHex = "#21262D",
                textHex = "#FFFFFF",
                guideInfo = gInfo
            )
            val xStart = offset3 + (i * w10)
            keyRects[k.id] = RectF(xStart + padding, rowHeight * 2 + padding, xStart + w10 - padding, rowHeight * 3 - padding)
            keyModels[k.id] = k
        }

        // Hàng 4 (9 phím): [⇧ Shift] + ZXCVBNM + [⌫]
        val shiftW = width * 0.14f
        val bkspW = width * 0.16f
        val midW = (width - shiftW - bkspW) / 7f
        val y4 = rowHeight * 3

        val shiftDisplay = if (isCapsLock) "⇪" else "⇧"
        val shiftBg = when {
            isCapsLock -> "#1F6FEB"
            isShiftActive -> "#D29922"
            else -> "#30363D"
        }
        val shiftModel = KeyModel(
            id = "guide_3_0",
            baseLabel = shiftDisplay,
            displayChar = shiftDisplay,
            action = KeyboardAction.CommitText(""),
            bgHex = shiftBg,
            textHex = "#FFFFFF",
            isSpecial = true,
            textSizeSp = 20f
        )
        keyRects[shiftModel.id] = RectF(padding, y4 + padding, shiftW - padding, y4 + rowHeight - padding)
        keyModels[shiftModel.id] = shiftModel

        val rawR4 = listOf('z', 'x', 'c', 'v', 'b', 'n', 'm')
        for (i in rawR4.indices) {
            val baseChar = rawR4[i]
            val item = MnemonicDatabase.get(baseChar)
            val displayChar = if (isShiftActive || isCapsLock) {
                item?.upper?.toString() ?: baseChar.uppercase()
            } else {
                baseChar.toString()
            }
            val targetChar = displayChar[0]
            val gInfo = createGuideInfo(targetChar)
            val k = KeyModel(
                id = "guide_3_${i + 1}",
                baseLabel = baseChar.toString(),
                displayChar = displayChar,
                action = KeyboardAction.CommitText(displayChar),
                bgHex = "#21262D",
                textHex = "#FFFFFF",
                guideInfo = gInfo
            )
            val xStart = shiftW + (i * midW)
            keyRects[k.id] = RectF(xStart + padding, y4 + padding, xStart + midW - padding, y4 + rowHeight - padding)
            keyModels[k.id] = k
        }

        val bkspModel = KeyModel(
            id = "guide_3_8",
            baseLabel = "⌫",
            displayChar = "⌫",
            action = KeyboardAction.Backspace,
            bgHex = "#30363D",
            textHex = "#F85149",
            isSpecial = true
        )
        keyRects[bkspModel.id] = RectF(width - bkspW + padding, y4 + padding, width - padding, y4 + rowHeight - padding)
        keyModels[bkspModel.id] = bkspModel

        // Hàng 5: [✕ Thoát: 0.18] [❖ Mode: 0.14] [Space: 0.38] [🔍: 0.14] [↵: 0.16] = 1.00
        val y5 = rowHeight * 4
        val r5Defs = listOf(
            KeyModel("key_close_guide", "✕ Thoát", "✕ Thoát", action = KeyboardAction.CommitText(""), bgHex = "#DA3633", textHex = "#FFFFFF", isSpecial = true, textSizeSp = 13f),
            KeyModel("key_mode_toggle", "❖", "❖", action = KeyboardAction.CommitText(""), bgHex = "#30363D", textHex = "#58A6FF", isSpecial = true),
            KeyModel("space", "Space", "Space (Học Base60)", subLabel = "Guide", action = KeyboardAction.CommitText(" "), bgHex = "#2D333B", textHex = "#E6EDF3", textSizeSp = 13f),
            KeyModel("search", "Search", "🔍", action = KeyboardAction.Search, bgHex = if (isNativeSearchContext) "#1F6FEB" else "#30363D", textHex = "#FFFFFF", isSpecial = true),
            KeyModel("enter", "Enter", "↵", action = KeyboardAction.Enter, bgHex = "#238636", textHex = "#FFFFFF", isSpecial = true)
        )
        val r5Weights = listOf(0.18f, 0.14f, 0.38f, 0.14f, 0.16f)
        var curX = 0f
        for (idx in r5Defs.indices) {
            val k = r5Defs[idx]
            val keyW = width * r5Weights[idx]
            keyRects[k.id] = RectF(curX + padding, y5 + padding, curX + keyW - padding, y5 + rowHeight - padding)
            keyModels[k.id] = k
            curX += keyW
        }
    }

    // ========================================================
    // 1. TẦNG BÌNH THƯỜNG (KÈM SHIFT GBOARD)
    // ========================================================
    private fun calculateNormalKeys(width: Int, rowHeight: Float, padding: Float) {
        val w10 = width / 10f
        var currentRowIdx = 0

        // Hàng 0: Ký hiệu mở rộng (ChipKeyConfig.rowSymbols) - nếu đang bật hiển thị
        if (isRowSymbolsVisible) {
            val r0Y = currentRowIdx * rowHeight
            for (i in ChipKeyConfig.rowSymbols.indices) {
                val chip = ChipKeyConfig.rowSymbols[i]
                val label = if (isShiftActive || isCapsLock) chip.shift else chip.char
                val bg = if (isShiftActive) "#4A3718" else "#1C2128"
                val k = KeyModel(
                    id = "norm_s_$i",
                    baseLabel = chip.char,
                    displayChar = label,
                    action = KeyboardAction.CommitText(label),
                    bgHex = bg,
                    textHex = "#FFFFFF",
                    chipDef = chip
                )
                keyRects[k.id] = RectF(i * w10 + padding, r0Y + padding, (i + 1) * w10 - padding, r0Y + rowHeight - padding)
                keyModels[k.id] = k
            }
            currentRowIdx++
        }

        // Hàng 1: Hàng Số (ChipKeyConfig.rowNumbers)
        val r1Y = currentRowIdx * rowHeight
        for (i in ChipKeyConfig.rowNumbers.indices) {
            val chip = ChipKeyConfig.rowNumbers[i]
            val label = if (isShiftActive || isCapsLock) chip.shift else chip.char
            val bg = if (isShiftActive) "#4A3718" else "#21262D"
            val k = KeyModel(
                id = "norm_0_$i",
                baseLabel = chip.char,
                displayChar = label,
                action = KeyboardAction.CommitText(label),
                bgHex = bg,
                textHex = "#FFFFFF",
                chipDef = chip
            )
            keyRects[k.id] = RectF(i * w10 + padding, r1Y + padding, (i + 1) * w10 - padding, r1Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 2: QWERTY (ChipKeyConfig.rowQWERTY)
        val r2Y = currentRowIdx * rowHeight
        for (i in ChipKeyConfig.rowQWERTY.indices) {
            val chip = ChipKeyConfig.rowQWERTY[i]
            val label = if (isShiftActive || isCapsLock) chip.char.uppercase() else chip.char
            val k = KeyModel(
                id = "norm_1_$i",
                baseLabel = chip.char,
                displayChar = label,
                action = KeyboardAction.CommitText(label),
                bgHex = "#21262D",
                textHex = "#FFFFFF",
                chipDef = chip
            )
            keyRects[k.id] = RectF(i * w10 + padding, r2Y + padding, (i + 1) * w10 - padding, r2Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 3: ASDFGHJKL (ChipKeyConfig.rowASDF - 9 phím, lệch nửa phím)
        val r3Y = currentRowIdx * rowHeight
        val offset3 = w10 * 0.5f
        for (i in ChipKeyConfig.rowASDF.indices) {
            val chip = ChipKeyConfig.rowASDF[i]
            val label = if (isShiftActive || isCapsLock) chip.char.uppercase() else chip.char
            val k = KeyModel(
                id = "norm_2_$i",
                baseLabel = chip.char,
                displayChar = label,
                action = KeyboardAction.CommitText(label),
                bgHex = "#21262D",
                textHex = "#FFFFFF",
                chipDef = chip
            )
            val xStart = offset3 + (i * w10)
            keyRects[k.id] = RectF(xStart + padding, r3Y + padding, xStart + w10 - padding, r3Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 4: [⇧ Shift / ⇪ Caps] + [ChipKeyConfig.rowZXCV - 7 phím] + [⌫ Backspace]
        val r4Y = currentRowIdx * rowHeight
        val shiftW = width * 0.14f
        val bkspW = width * 0.16f
        val midW = (width - shiftW - bkspW) / 7f

        val shiftDisplay = if (isCapsLock) "⇪" else "⇧"
        val shiftBg = when {
            isCapsLock -> "#1F6FEB"
            isShiftActive -> "#D29922"
            else -> "#30363D"
        }
        val shiftModel = KeyModel(
            id = "norm_3_0",
            baseLabel = shiftDisplay,
            displayChar = shiftDisplay,
            action = KeyboardAction.CommitText(""),
            bgHex = shiftBg,
            textHex = "#FFFFFF",
            isSpecial = true,
            textSizeSp = 20f
        )
        keyRects[shiftModel.id] = RectF(padding, r4Y + padding, shiftW - padding, r4Y + rowHeight - padding)
        keyModels[shiftModel.id] = shiftModel

        for (i in ChipKeyConfig.rowZXCV.indices) {
            val chip = ChipKeyConfig.rowZXCV[i]
            val label = if (isShiftActive || isCapsLock) chip.char.uppercase() else chip.char
            val k = KeyModel(
                id = "norm_3_${i + 1}",
                baseLabel = chip.char,
                displayChar = label,
                action = KeyboardAction.CommitText(label),
                bgHex = "#21262D",
                textHex = "#FFFFFF",
                chipDef = chip
            )
            val xStart = shiftW + (i * midW)
            keyRects[k.id] = RectF(xStart + padding, r4Y + padding, xStart + midW - padding, r4Y + rowHeight - padding)
            keyModels[k.id] = k
        }

        val bkspModel = KeyModel(
            id = "norm_3_8",
            baseLabel = "⌫",
            displayChar = "⌫",
            subLabel = "⌫W",
            action = KeyboardAction.Backspace,
            bgHex = "#30363D",
            textHex = "#F85149",
            isSpecial = true
        )
        keyRects[bkspModel.id] = RectF(width - bkspW + padding, r4Y + padding, width - padding, r4Y + rowHeight - padding)
        keyModels[bkspModel.id] = bkspModel
        currentRowIdx++

        // Hàng 5 (hoặc 4 nếu ẩn hàng 0): Hàng phím chức năng dưới cùng
        val r5Y = currentRowIdx * rowHeight
        calculateBottomRow(width, rowHeight, padding, isMode = false, isVowel = false, yOffset = r5Y)
    }

    // ========================================================
    // 2. TẦNG MODE CƠ SỐ 16 & BIÊN TẬP (0..e)
    // ========================================================
    private fun calculateModeKeys(width: Int, rowHeight: Float, padding: Float) {
        val w10 = width / 10f
        var currentRowIdx = 0

        // Hàng 0: Cụm Con trỏ & Chọn khối (10 phím) - hiển thị khi bật Hàng 0 (isRowSymbolsVisible)
        if (isRowSymbolsVisible) {
            val r0Y = currentRowIdx * rowHeight
            val cursorKeys = listOf(
                KeyModel("cursor_home", "⇤", "⇤", subLabel = "Home", action = KeyboardAction.MoveHome, bgHex = "#161B22", textHex = "#58A6FF", isSpecial = true, textSizeSp = 15f),
                KeyModel("cursor_up", "▲", "▲", subLabel = "Up", action = KeyboardAction.MoveUp, bgHex = "#161B22", textHex = "#58A6FF", isSpecial = true, textSizeSp = 15f),
                KeyModel("cursor_end", "⇥", "⇥", subLabel = "End", action = KeyboardAction.MoveEnd, bgHex = "#161B22", textHex = "#58A6FF", isSpecial = true, textSizeSp = 15f),
                KeyModel("cursor_left", "◀", "◀", subLabel = "Left", action = KeyboardAction.MoveLeft, bgHex = "#161B22", textHex = "#58A6FF", isSpecial = true, textSizeSp = 15f),
                KeyModel("cursor_down", "▼", "▼", subLabel = "Down", action = KeyboardAction.MoveDown, bgHex = "#161B22", textHex = "#58A6FF", isSpecial = true, textSizeSp = 15f),
                KeyModel("cursor_right", "▶", "▶", subLabel = "Right", action = KeyboardAction.MoveRight, bgHex = "#161B22", textHex = "#58A6FF", isSpecial = true, textSizeSp = 15f),
                KeyModel("cursor_sel_start", "⏮|", "⏮|", subLabel = "Đầu", action = KeyboardAction.SelectToStart, bgHex = "#161B22", textHex = "#79C0FF", isSpecial = true, textSizeSp = 13.5f),
                KeyModel("cursor_sel_end", "|⏭", "|⏭", subLabel = "Cuối", action = KeyboardAction.SelectToEnd, bgHex = "#161B22", textHex = "#79C0FF", isSpecial = true, textSizeSp = 13.5f),
                KeyModel("cursor_sel_para", "¶", "¶", subLabel = "Đoạn", action = KeyboardAction.SelectParagraph, bgHex = "#161B22", textHex = "#79C0FF", isSpecial = true, textSizeSp = 15f),
                KeyModel("cursor_sel_sent", "🔤.", "🔤.", subLabel = "Câu", action = KeyboardAction.SelectToEndOfSentence, bgHex = "#161B22", textHex = "#79C0FF", isSpecial = true, textSizeSp = 13.5f)
            )
            for (i in cursorKeys.indices) {
                val k = cursorKeys[i]
                keyRects[k.id] = RectF(i * w10 + padding, r0Y + padding, (i + 1) * w10 - padding, r0Y + rowHeight - padding)
                keyModels[k.id] = k
            }
            currentRowIdx++
        }

        // Hàng 1: Biên tập (Undo, Redo, Clear) & Các Hex Mode đặc thù (3..9) - Đã bỏ Mode 0, 1, 2
        val r1Y = currentRowIdx * rowHeight
        val r1Keys = listOf(
            KeyModel("mode_undo", "1", "↶", subLabel = "1", action = KeyboardAction.Undo, bgHex = "#21262D", textHex = "#D29922", isSpecial = true, textSizeSp = 16f),
            KeyModel("mode_redo", "2", "↷", subLabel = "2", action = KeyboardAction.Redo, bgHex = "#21262D", textHex = "#D29922", isSpecial = true, textSizeSp = 16f),
            KeyModel("mode_3", "3", "🟡", subLabel = "3", action = KeyboardAction.SwitchMode('3', "3: Giờ thiêng [4 số]", "🟡"), bgHex = "#21262D", textHex = "#D29922"),
            KeyModel("mode_4", "4", "✨", subLabel = "4", action = KeyboardAction.SwitchMode('4', "4: Kỳ quan", "✨"), bgHex = "#21262D", textHex = "#D29922"),
            KeyModel("mode_5", "5", "🔠", subLabel = "5", action = KeyboardAction.SwitchMode('5', "5: Cyber Font", "🔠"), bgHex = "#21262D", textHex = "#58A6FF"),
            KeyModel("mode_6", "6", "🖊️", subLabel = "6", action = KeyboardAction.SwitchMode('6', "6: ViScript", "🖊️"), bgHex = "#21262D", textHex = "#3FB950"),
            KeyModel("mode_7", "7", "🔶", subLabel = "7", action = KeyboardAction.SwitchMode('7', "7: Unicode Zero", "🔶"), bgHex = "#21262D", textHex = "#BD561D"),
            KeyModel("mode_8", "8", "⏱️", subLabel = "8", action = KeyboardAction.SwitchMode('8', "8: Thời gian [6 số]", "⏱️"), bgHex = "#21262D", textHex = "#DA3633"),
            KeyModel("mode_9", "9", "🔢", subLabel = "9", action = KeyboardAction.SwitchMode('9', "9: Thời gian [5 số]", "🔢"), bgHex = "#21262D", textHex = "#BC8CFF"),
            KeyModel("mode_clear", "0", "🧹", subLabel = "0", action = KeyboardAction.ClearAll, bgHex = "#21262D", textHex = "#F85149", isSpecial = true, textSizeSp = 15f)
        )
        for (i in r1Keys.indices) {
            val k = r1Keys[i]
            keyRects[k.id] = RectF(i * w10 + padding, r1Y + padding, (i + 1) * w10 - padding, r1Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 2: QWERTY (q w e r t y u i o p) - Bỏ toàn bộ ngoặc, chỉ giữ Mode e
        val r2Y = currentRowIdx * rowHeight
        val rawR2 = listOf("q", "w", "e", "r", "t", "y", "u", "i", "o", "p")
        for (i in rawR2.indices) {
            val char = rawR2[i]
            val k = if (char == "e") {
                KeyModel("mode_e", "e", "🌟", subLabel = "e", action = KeyboardAction.SwitchMode('e', "e: Giả Việt Tối giản", "🌟"), bgHex = "#21262D", textHex = "#DB61A2")
            } else {
                KeyModel("mode_blank_r2_$i", char, "·", subLabel = char, action = KeyboardAction.CommitText(""), bgHex = "#161B22", textHex = "#484F58", isSpecial = true)
            }
            keyRects[k.id] = RectF(i * w10 + padding, r2Y + padding, (i + 1) * w10 - padding, r2Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 3: ASDF (a s d f g h j k l) - Giữ Mode a, d; Guide g; Case h; Các phím còn lại để trống
        val r3Y = currentRowIdx * rowHeight
        val rawR3 = listOf("a", "s", "d", "f", "g", "h", "j", "k", "l")
        val offset3 = w10 * 0.5f
        for (i in rawR3.indices) {
            val char = rawR3[i]
            val k = when (char) {
                "a" -> KeyModel("mode_a", "a", "//", subLabel = "a", action = KeyboardAction.SwitchMode('a', "a: CVNSS 4.0 Song song", "//"), bgHex = "#21262D", textHex = "#58A6FF", textSizeSp = 15f)
                "d" -> KeyModel("mode_d", "d", "📝", subLabel = "d", action = KeyboardAction.SwitchMode('d', "d: Không dấu liền", "📝"), bgHex = "#21262D", textHex = "#3FB950")
                "g" -> KeyModel("mode_guide", "g", "📖", subLabel = "g", action = KeyboardAction.OpenGuideLayer, bgHex = "#21262D", textHex = "#58A6FF")
                "h" -> KeyModel("util_h", "h", "Aa", subLabel = "h", action = KeyboardAction.ToggleCase, bgHex = "#21262D", textHex = "#58A6FF", textSizeSp = 14f)
                else -> KeyModel("mode_blank_r3_$i", char, "·", subLabel = char, action = KeyboardAction.CommitText(""), bgHex = "#161B22", textHex = "#484F58", isSpecial = true)
            }
            val xStart = offset3 + (i * w10)
            keyRects[k.id] = RectF(xStart + padding, r3Y + padding, xStart + w10 - padding, r3Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 4: [⇧ Shift: 14%] + (c b + blank) + [⌦ Del: 16%]
        val shiftW = width * 0.14f
        val bkspW = width * 0.16f
        val midW = (width - shiftW - bkspW) / 7f
        val r4Y = currentRowIdx * rowHeight

        val shiftModel = KeyModel(
            id = "key_shift_toggle",
            baseLabel = "⇧",
            displayChar = "⇧",
            action = KeyboardAction.CommitText(""),
            bgHex = "#30363D",
            textHex = "#8B949E",
            isSpecial = true
        )
        keyRects[shiftModel.id] = RectF(padding, r4Y + padding, shiftW - padding, r4Y + rowHeight - padding)
        keyModels[shiftModel.id] = shiftModel

        val rawR4 = listOf("z", "x", "c", "v", "b", "n", "m")
        for (i in rawR4.indices) {
            val char = rawR4[i]
            val k = when (char) {
                "c" -> KeyModel("mode_c", "c", "🐫", subLabel = "c", action = KeyboardAction.SwitchMode('c', "c: camelCase", "🐫"), bgHex = "#21262D", textHex = "#D29922")
                "b" -> KeyModel("mode_b", "b", "✝️", subLabel = "b", action = KeyboardAction.SwitchMode('b', "b: Mã Giả Việt", "✝️"), bgHex = "#21262D", textHex = "#BC8CFF")
                else -> KeyModel("mode_blank_r4_$i", char, "·", subLabel = char, action = KeyboardAction.CommitText(""), bgHex = "#161B22", textHex = "#484F58", isSpecial = true)
            }
            val xStart = shiftW + (i * midW)
            keyRects[k.id] = RectF(xStart + padding, r4Y + padding, xStart + midW - padding, r4Y + rowHeight - padding)
            keyModels[k.id] = k
        }

        val delModel = KeyModel(
            id = "key_bksp",
            baseLabel = "⌦",
            displayChar = "⌦",
            subLabel = "Del",
            action = KeyboardAction.DeleteForward,
            bgHex = "#30363D",
            textHex = "#58A6FF",
            isSpecial = true
        )
        keyRects[delModel.id] = RectF(width - bkspW + padding, r4Y + padding, width - padding, r4Y + rowHeight - padding)
        keyModels[delModel.id] = delModel
        currentRowIdx++

        // Hàng 5: [❖ Mode: 12%] [ớ: 11%] [·: 10%] [Select All: 33%] [·: 10%] [🔍: 10%] [↵: 14%]
        val r5Y = currentRowIdx * rowHeight
        calculateBottomRow(width, rowHeight, padding, isMode = true, isVowel = false, yOffset = r5Y)
    }

    // ========================================================
    // 3. TẦNG TIẾNG VIỆT THÔNG MINH [ớ]
    // ========================================================
    private fun calculateVowelSelectorKeys(width: Int, rowHeight: Float, padding: Float) {
        val w10 = width / 10f
        var currentRowIdx = 0
        val singleVowels = setOf("a", "ă", "â", "e", "ê", "i", "o", "ô", "ơ", "u", "ư", "y")

        // Hàng 0: Ký hiệu mở rộng (ChipKeyConfig.rowSymbols - 10 phím)
        if (isRowSymbolsVisible) {
            val r0Y = currentRowIdx * rowHeight
            for (i in ChipKeyConfig.rowSymbols.indices) {
                val chip = ChipKeyConfig.rowSymbols[i]
                val rhyme = chip.tl
                val bg = if (rhyme in singleVowels) "#238636" else "#0E6B65"
                val k = KeyModel(
                    id = "vowel_s_$i",
                    baseLabel = rhyme,
                    displayChar = rhyme,
                    subLabel = chip.key,
                    action = KeyboardAction.CommitText(rhyme),
                    bgHex = bg,
                    textHex = "#FFFFFF",
                    textSizeSp = if (rhyme.length > 3) 12f else 15f
                )
                keyRects[k.id] = RectF(i * w10 + padding, r0Y + padding, (i + 1) * w10 - padding, r0Y + rowHeight - padding)
                keyModels[k.id] = k
            }
            currentRowIdx++
        }

        // Hàng 1: Số (ChipKeyConfig.rowNumbers - 10 phím)
        val r1Y = currentRowIdx * rowHeight
        for (i in ChipKeyConfig.rowNumbers.indices) {
            val chip = ChipKeyConfig.rowNumbers[i]
            val rhyme = chip.tl
            val bg = if (rhyme in singleVowels) "#238636" else "#0E6B65"
            val k = KeyModel(
                id = "vowel_0_$i",
                baseLabel = rhyme,
                displayChar = rhyme,
                subLabel = chip.key,
                action = KeyboardAction.CommitText(rhyme),
                bgHex = bg,
                textHex = "#FFFFFF",
                textSizeSp = if (rhyme.length > 3) 12f else 15f
            )
            keyRects[k.id] = RectF(i * w10 + padding, r1Y + padding, (i + 1) * w10 - padding, r1Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 2: QWERTY (ChipKeyConfig.rowQWERTY - 10 phím)
        val r2Y = currentRowIdx * rowHeight
        for (i in ChipKeyConfig.rowQWERTY.indices) {
            val chip = ChipKeyConfig.rowQWERTY[i]
            val rhyme = chip.tl
            val bg = if (rhyme in singleVowels) "#238636" else "#0E6B65"
            val k = KeyModel(
                id = "vowel_1_$i",
                baseLabel = rhyme,
                displayChar = rhyme,
                subLabel = chip.key,
                action = KeyboardAction.CommitText(rhyme),
                bgHex = bg,
                textHex = "#FFFFFF",
                textSizeSp = if (rhyme.length > 3) 12f else 15f
            )
            keyRects[k.id] = RectF(i * w10 + padding, r2Y + padding, (i + 1) * w10 - padding, r2Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 3: ASDFGHJKL (ChipKeyConfig.rowASDF - 9 phím, lệch nửa phím)
        val r3Y = currentRowIdx * rowHeight
        val offset3 = w10 * 0.5f
        for (i in ChipKeyConfig.rowASDF.indices) {
            val chip = ChipKeyConfig.rowASDF[i]
            val rhyme = chip.tl
            val bg = if (rhyme in singleVowels) "#238636" else "#0E6B65"
            val k = KeyModel(
                id = "vowel_2_$i",
                baseLabel = rhyme,
                displayChar = rhyme,
                subLabel = chip.key,
                action = KeyboardAction.CommitText(rhyme),
                bgHex = bg,
                textHex = "#FFFFFF",
                textSizeSp = if (rhyme.length > 3) 12f else 15f
            )
            val xStart = offset3 + (i * w10)
            keyRects[k.id] = RectF(xStart + padding, r3Y + padding, xStart + w10 - padding, r3Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 4: [⇧ Shift] + [ChipKeyConfig.rowZXCV - 7 phím] + [⌫ Backspace]
        val r4Y = currentRowIdx * rowHeight
        val shiftW = width * 0.14f
        val bkspW = width * 0.16f
        val midW = (width - shiftW - bkspW) / 7f

        val shiftModel = KeyModel(
            id = "vowel_3_0",
            baseLabel = "⇧",
            displayChar = "⇧",
            action = KeyboardAction.CommitText(""),
            bgHex = if (isVowelSymbolShift) "#D29922" else "#30363D",
            textHex = if (isVowelSymbolShift) "#FFFFFF" else "#E6EDF3",
            isSpecial = true,
            textSizeSp = 20f
        )
        keyRects[shiftModel.id] = RectF(padding, r4Y + padding, shiftW - padding, r4Y + rowHeight - padding)
        keyModels[shiftModel.id] = shiftModel

        for (i in ChipKeyConfig.rowZXCV.indices) {
            val chip = ChipKeyConfig.rowZXCV[i]
            val rhyme = chip.tl
            val bg = if (rhyme in singleVowels) "#238636" else "#0E6B65"
            val k = KeyModel(
                id = "vowel_3_${i + 1}",
                baseLabel = rhyme,
                displayChar = rhyme,
                subLabel = chip.key,
                action = KeyboardAction.CommitText(rhyme),
                bgHex = bg,
                textHex = "#FFFFFF",
                textSizeSp = if (rhyme.length > 3) 12f else 15f
            )
            val xStart = shiftW + (i * midW)
            keyRects[k.id] = RectF(xStart + padding, r4Y + padding, xStart + midW - padding, r4Y + rowHeight - padding)
            keyModels[k.id] = k
        }

        val bkspModel = KeyModel(
            id = "vowel_3_8",
            baseLabel = "⌫",
            displayChar = "⌫",
            subLabel = "⌫W",
            action = KeyboardAction.Backspace,
            bgHex = "#30363D",
            textHex = "#F85149",
            isSpecial = true
        )
        keyRects[bkspModel.id] = RectF(width - bkspW + padding, r4Y + padding, width - padding, r4Y + rowHeight - padding)
        keyModels[bkspModel.id] = bkspModel
        currentRowIdx++

        // Hàng 5: Hàng chức năng dưới cùng
        val r5Y = currentRowIdx * rowHeight
        calculateBottomRow(width, rowHeight, padding, isMode = false, isVowel = true, yOffset = r5Y)
    }

    // ========================================================
    // 3B. TẦNG TRA CỨU & SOI VẦN THÔNG MINH (SPOTLIGHT SEARCH)
    // ========================================================
    data class HiddenRhymeMatch(
        val rhyme: String,
        val isUpper: Boolean,
        val keyChar: Char,
        val word: String,
        val code: String,
        val phrase: String
    )

    private fun getHiddenRhymeMatch(ch: Char, query: String, matchAnywhere: Boolean): HiddenRhymeMatch? {
        if (!isSearchHiddenRhymesEnabled || query.isEmpty()) return null
        val item = MnemonicDatabase.get(ch) ?: return null
        // 1. Kiểm tra 3 vần thường (lowerRhymes)
        for ((idx, r) in item.lowerRhymes.withIndex()) {
            if (r.isNotEmpty() && isRhymeMatched(r, query, true, true, matchAnywhere)) {
                val sample = item.samples.getOrNull(idx)
                return HiddenRhymeMatch(
                    rhyme = r,
                    isUpper = false,
                    keyChar = ch.lowercaseChar(),
                    word = sample?.word ?: "",
                    code = sample?.code ?: "",
                    phrase = item.lowerPhrase
                )
            }
        }
        // 2. Kiểm tra 3 vần hoa (upperRhymes)
        for ((idx, r) in item.upperRhymes.withIndex()) {
            if (r.isNotEmpty() && isRhymeMatched(r, query, true, true, matchAnywhere)) {
                val sample = item.samples.getOrNull(idx + 3)
                return HiddenRhymeMatch(
                    rhyme = r,
                    isUpper = true,
                    keyChar = item.upper,
                    word = sample?.word ?: "",
                    code = sample?.code ?: "",
                    phrase = item.upperPhrase
                )
            }
        }
        return null
    }

    private fun findFirstHiddenMatch(query: String, matchAnywhere: Boolean): HiddenRhymeMatch? {
        if (!isSearchHiddenRhymesEnabled || query.isEmpty()) return null
        for (item in MnemonicDatabase.ITEMS) {
            val m = getHiddenRhymeMatch(item.lower, query, matchAnywhere)
            if (m != null) return m
        }
        return null
    }

    private fun calculateSearchKeys(width: Int, rowHeight: Float, padding: Float) {
        val w10 = width / 10f
        var currentRowIdx = 0

        // Hàng 0: Ký hiệu mở rộng (ChipKeyConfig.rowSymbols - 10 phím)
        if (isRowSymbolsVisible) {
            val r0Y = currentRowIdx * rowHeight
            for (i in ChipKeyConfig.rowSymbols.indices) {
                val chip = ChipKeyConfig.rowSymbols[i]
                val rhyme = chip.tl
                val k = KeyModel(
                    id = "search_s_$i",
                    baseLabel = rhyme,
                    displayChar = rhyme,
                    subLabel = chip.key,
                    action = KeyboardAction.CommitText(""),
                    bgHex = "#0E6B65",
                    textHex = "#FFFFFF",
                    textSizeSp = if (rhyme.length > 3) 12f else 15f
                )
                keyRects[k.id] = RectF(i * w10 + padding, r0Y + padding, (i + 1) * w10 - padding, r0Y + rowHeight - padding)
                keyModels[k.id] = k
            }
            currentRowIdx++
        }

        // Hàng 1: Số (ChipKeyConfig.rowNumbers - 10 phím)
        val r1Y = currentRowIdx * rowHeight
        for (i in ChipKeyConfig.rowNumbers.indices) {
            val chip = ChipKeyConfig.rowNumbers[i]
            val rhyme = chip.tl
            val k = KeyModel(
                id = "search_0_$i",
                baseLabel = rhyme,
                displayChar = rhyme,
                subLabel = chip.key,
                action = KeyboardAction.CommitText(""),
                bgHex = "#0E6B65",
                textHex = "#FFFFFF",
                textSizeSp = if (rhyme.length > 3) 12f else 15f
            )
            keyRects[k.id] = RectF(i * w10 + padding, r1Y + padding, (i + 1) * w10 - padding, r1Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 2: QWERTY (ChipKeyConfig.rowQWERTY - 10 phím)
        val r2Y = currentRowIdx * rowHeight
        for (i in ChipKeyConfig.rowQWERTY.indices) {
            val chip = ChipKeyConfig.rowQWERTY[i]
            val rhyme = chip.tl
            val isMain = rhyme in listOf("e", "y", "u", "i", "o", "ư")
            val bg = if (isMain) "#238636" else "#0E6B65"
            val k = KeyModel(
                id = "search_1_$i",
                baseLabel = rhyme,
                displayChar = rhyme,
                subLabel = chip.key,
                action = KeyboardAction.CommitText(""),
                bgHex = bg,
                textHex = "#FFFFFF",
                textSizeSp = if (rhyme.length > 3) 12f else 15f
            )
            keyRects[k.id] = RectF(i * w10 + padding, r2Y + padding, (i + 1) * w10 - padding, r2Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 3: ASDFGHJKL (ChipKeyConfig.rowASDF - 9 phím, lệch nửa phím)
        val r3Y = currentRowIdx * rowHeight
        val offset3 = w10 * 0.5f
        for (i in ChipKeyConfig.rowASDF.indices) {
            val chip = ChipKeyConfig.rowASDF[i]
            val rhyme = chip.tl
            val bg = when (chip.key) {
                "a" -> "#238636"
                "d" -> "#2EA043"
                else -> "#0E6B65"
            }
            val k = KeyModel(
                id = "search_2_$i",
                baseLabel = rhyme,
                displayChar = rhyme,
                subLabel = chip.key,
                action = KeyboardAction.CommitText(""),
                bgHex = bg,
                textHex = "#FFFFFF",
                textSizeSp = if (rhyme.length > 3) 12f else 15f
            )
            val xStart = offset3 + (i * w10)
            keyRects[k.id] = RectF(xStart + padding, r3Y + padding, xStart + w10 - padding, r3Y + rowHeight - padding)
            keyModels[k.id] = k
        }
        currentRowIdx++

        // Hàng 4: [⇧ Shift] + [ChipKeyConfig.rowZXCV - 7 phím] + [⌫ Backspace]
        val r4Y = currentRowIdx * rowHeight
        val shiftW = width * 0.14f
        val bkspW = width * 0.16f
        val midW = (width - shiftW - bkspW) / 7f

        val shiftLabel = if (isSearchMatchAnywhere) "*a*" else "a_"
        val shiftSub = if (isSearchMatchAnywhere) "Chứa" else "Đầu"
        val shiftBg = if (isSearchMatchAnywhere) "#D29922" else "#30363D"

        val shiftModel = KeyModel(
            id = "search_shift",
            baseLabel = shiftLabel,
            displayChar = shiftLabel,
            subLabel = shiftSub,
            action = KeyboardAction.CommitText(""),
            bgHex = shiftBg,
            textHex = "#FFFFFF",
            isSpecial = true,
            textSizeSp = 15f
        )
        keyRects[shiftModel.id] = RectF(padding, r4Y + padding, shiftW - padding, r4Y + rowHeight - padding)
        keyModels[shiftModel.id] = shiftModel

        for (i in ChipKeyConfig.rowZXCV.indices) {
            val chip = ChipKeyConfig.rowZXCV[i]
            val rhyme = chip.tl
            val k = KeyModel(
                id = "search_3_${i + 1}",
                baseLabel = rhyme,
                displayChar = rhyme,
                subLabel = chip.key,
                action = KeyboardAction.CommitText(""),
                bgHex = "#0E6B65",
                textHex = "#FFFFFF",
                textSizeSp = if (rhyme.length > 3) 12f else 15f
            )
            val xStart = shiftW + (i * midW)
            keyRects[k.id] = RectF(xStart + padding, r4Y + padding, xStart + midW - padding, r4Y + rowHeight - padding)
            keyModels[k.id] = k
        }

        val bkspModel = KeyModel(
            id = "search_bksp",
            baseLabel = "⌫",
            displayChar = "⌫",
            subLabel = "Xóa",
            action = KeyboardAction.Backspace,
            bgHex = "#30363D",
            textHex = "#F85149",
            isSpecial = true
        )
        keyRects[bkspModel.id] = RectF(width - bkspW + padding, r4Y + padding, width - padding, r4Y + rowHeight - padding)
        keyModels[bkspModel.id] = bkspModel
        currentRowIdx++

        // Hàng 5: Hàng chức năng dưới cùng
        val r5Y = currentRowIdx * rowHeight
        val firstHidden = if (searchQuery.isNotEmpty()) findFirstHiddenMatch(searchQuery, isSearchMatchAnywhere) else null
        val queryText = when {
            searchQuery.isEmpty() -> "🔍 Chạm để soi..."
            firstHidden != null -> "🔍 $searchQuery ➔ [ ${firstHidden.keyChar} ] ${firstHidden.word} (${firstHidden.code})"
            else -> "🔍 [ $searchQuery ]"
        }
        val queryBgHex = if (firstHidden != null) "#271C48" else if (searchQuery.isNotEmpty()) "#1C2D42" else "#1C2128"
        val queryTextHex = if (firstHidden != null) "#F2CC60" else if (searchQuery.isNotEmpty()) "#58A6FF" else "#8B949E"
        val bgHidden = if (isSearchHiddenRhymesEnabled) "#D29922" else "#21262D"
        val textHidden = if (isSearchHiddenRhymesEnabled) "#FFFFFF" else "#8B949E"
        val subHidden = if (isSearchHiddenRhymesEnabled) "BẬT" else "TẮT"
        val bg3c = if (isFilter3c) "#1F6FEB" else "#21262D"
        val text3c = if (isFilter3c) "#FFFFFF" else "#8B949E"

        val defs = listOf(
            KeyModel("key_mode_toggle", "❖", "❖", action = KeyboardAction.CommitText(""), bgHex = "#30363D", textHex = "#58A6FF", isSpecial = true),
            KeyModel("key_vowel_toggle", "ớ", "ớ", action = KeyboardAction.CommitText(""), bgHex = "#30363D", textHex = "#3FB950", isSpecial = true),
            KeyModel("search_toggle_hidden", "Ẩn", "Ẩn", subLabel = subHidden, action = KeyboardAction.CommitText(""), bgHex = bgHidden, textHex = textHidden, textSizeSp = 14f, isSpecial = true),
            KeyModel("search_query_space", "SearchQuery", queryText, action = KeyboardAction.CommitText(""), bgHex = queryBgHex, textHex = queryTextHex, textSizeSp = if (firstHidden != null) 12f else 13.5f),
            KeyModel("search_filter_3c", "3c", "3c", subLabel = if (isFilter3c) "●" else null, action = KeyboardAction.CommitText(""), bgHex = bg3c, textHex = text3c, textSizeSp = 15f, isSpecial = true),
            KeyModel("search_close", "Close", "✕", action = KeyboardAction.CommitText(""), bgHex = "#DA3633", textHex = "#FFFFFF", isSpecial = true, textSizeSp = 16f),
            KeyModel("enter", "Enter", "↵", action = KeyboardAction.Enter, bgHex = "#238636", textHex = "#FFFFFF", isSpecial = true)
        )
        val weights = listOf(0.11f, 0.10f, 0.10f, 0.36f, 0.10f, 0.11f, 0.12f)
        var curX = 0f
        for (idx in defs.indices) {
            val k = defs[idx]
            val keyW = width * weights[idx]
            keyRects[k.id] = RectF(curX + padding, r5Y + padding, curX + keyW - padding, r5Y + rowHeight - padding)
            keyModels[k.id] = k
            curX += keyW
        }
    }

    private fun normalizeSearchStr(s: String): String {
        val map = mapOf(
            'à' to 'a', 'á' to 'a', 'ả' to 'a', 'ã' to 'a', 'ạ' to 'a',
            'ằ' to 'ă', 'ắ' to 'ă', 'ẳ' to 'ă', 'ẵ' to 'ă', 'ặ' to 'ă',
            'ầ' to 'â', 'ấ' to 'â', 'ẩ' to 'â', 'ẫ' to 'â', 'ậ' to 'â',
            'è' to 'e', 'é' to 'e', 'ẻ' to 'e', 'ẽ' to 'e', 'ẹ' to 'e',
            'ề' to 'ê', 'ế' to 'ê', 'ể' to 'ê', 'ễ' to 'ê', 'ệ' to 'ê',
            'ì' to 'i', 'í' to 'i', 'ỉ' to 'i', 'ĩ' to 'i', 'ị' to 'i',
            'ò' to 'o', 'ó' to 'o', 'ỏ' to 'o', 'õ' to 'o', 'ọ' to 'o',
            'ồ' to 'ô', 'ố' to 'ô', 'ổ' to 'ô', 'ỗ' to 'ô', 'ộ' to 'ô',
            'ờ' to 'ơ', 'ớ' to 'ơ', 'ở' to 'ơ', 'ỡ' to 'ơ', 'ợ' to 'ơ',
            'ù' to 'u', 'ú' to 'u', 'ủ' to 'u', 'ũ' to 'u', 'ụ' to 'u',
            'ừ' to 'ư', 'ứ' to 'ư', 'ử' to 'ư', 'ữ' to 'ư', 'ự' to 'ư',
            'ỳ' to 'y', 'ý' to 'y', 'ỷ' to 'y', 'ỹ' to 'y', 'ỵ' to 'y',
            'đ' to 'd'
        )
        val sb = StringBuilder()
        for (c in s.lowercase().trim()) {
            sb.append(map[c] ?: c)
        }
        return sb.toString()
    }

    private fun toPureLatin(s: String): String {
        val norm = normalizeSearchStr(s)
        return norm.replace('ă', 'a').replace('â', 'a')
            .replace('ê', 'e')
            .replace('ô', 'o').replace('ơ', 'o')
            .replace('ư', 'u')
            .replace('đ', 'd')
    }

    private fun isRhymeMatched(rhyme: String, query: String, f2c: Boolean, f3c: Boolean, matchAnywhere: Boolean): Boolean {
        if (query.isEmpty()) return true
        val len = rhyme.length
        val pureRhyme = toPureLatin(rhyme)
        val pureQuery = toPureLatin(query)

        // 1. Kiểm tra bộ lọc độ dài ký tự
        if (query.length == 1) {
            if (len == 1) {
                // 1c: Luôn luôn hiển thị nếu khớp query
            } else if (len == 2) {
                if (!f2c) return false
            } else {
                // len >= 3
                if (!f3c) return false
            }
        } else if (query.length == 2) {
            if (len >= 3 && !f3c) return false
        }

        // 2. So khớp âm vần (Khớp bất kỳ vị trí [ *a* ] hoặc Khớp tiền tố [ a_ ])
        return if (matchAnywhere) {
            if (pureQuery == "i" || pureQuery == "y") {
                pureRhyme.contains("i") || pureRhyme.contains("y")
            } else {
                pureRhyme.contains(pureQuery)
            }
        } else {
            if (pureQuery == "i" || pureQuery == "y") {
                pureRhyme.startsWith("i") || pureRhyme.startsWith("y")
            } else {
                pureRhyme.startsWith(pureQuery)
            }
        }
    }

    // ========================================================
    // 4. TẦNG KÝ HIỆU MỞ RỘNG (KHI BẤM SHIFT TRONG TẦNG [ớ])
    // ========================================================
    private fun calculateVowelShiftSymbols(width: Int, rowHeight: Float, padding: Float) {
        val w10 = width / 10f

        // Hàng 1: : ; " ' / \ | < > `
        val r1 = listOf(":", ";", "\"", "'", "/", "\\", "|", "<", ">", "`")
        for (i in r1.indices) {
            val sym = r1[i]
            val k = KeyModel("sym_r1_$i", sym, sym, action = KeyboardAction.CommitText(sym), bgHex = "#4A3718", textHex = "#F0D095")
            keyRects[k.id] = RectF(i * w10 + padding, padding, (i + 1) * w10 - padding, rowHeight - padding)
            keyModels[k.id] = k
        }

        // Hàng 2: { } [ ] ( ) ₫ $ € £
        val r2 = listOf("{", "}", "[", "]", "(", ")", "₫", "$", "€", "£")
        for (i in r2.indices) {
            val sym = r2[i]
            val k = KeyModel("sym_r2_$i", sym, sym, action = KeyboardAction.CommitText(sym), bgHex = "#4A3718", textHex = "#F0D095")
            keyRects[k.id] = RectF(i * w10 + padding, rowHeight + padding, (i + 1) * w10 - padding, rowHeight * 2 - padding)
            keyModels[k.id] = k
        }

        // Hàng 3: % ^ & * # @ ~ … • (9 phím)
        val r3 = listOf("%", "^", "&", "*", "#", "@", "~", "…", "•")
        val offset3 = w10 * 0.5f
        for (i in r3.indices) {
            val sym = r3[i]
            val k = KeyModel("sym_r3_$i", sym, sym, action = KeyboardAction.CommitText(sym), bgHex = "#4A3718", textHex = "#F0D095")
            val xStart = offset3 + (i * w10)
            keyRects[k.id] = RectF(xStart + padding, rowHeight * 2 + padding, xStart + w10 - padding, rowHeight * 3 - padding)
            keyModels[k.id] = k
        }

        // Hàng 4: [⇧ Shift (đang bật)] + [+ - = × ÷ ± °] + [⌫]
        val shiftW = width * 0.14f
        val bkspW = width * 0.16f
        val midW = (width - shiftW - bkspW) / 7f
        val y4 = rowHeight * 3

        val shiftModel = KeyModel(
            id = "key_vowel_shift_toggle",
            baseLabel = "⇧",
            displayChar = "⇧",
            action = KeyboardAction.CommitText(""),
            bgHex = "#D29922",
            textHex = "#FFFFFF",
            isSpecial = true,
            textSizeSp = 20f
        )
        keyRects[shiftModel.id] = RectF(padding, y4 + padding, shiftW - padding, y4 + rowHeight - padding)
        keyModels[shiftModel.id] = shiftModel

        val r4 = listOf("+", "-", "=", "×", "÷", "±", "°")
        for (i in r4.indices) {
            val sym = r4[i]
            val k = KeyModel("sym_r4_$i", sym, sym, action = KeyboardAction.CommitText(sym), bgHex = "#2D333B", textHex = "#E6EDF3")
            val xStart = shiftW + (i * midW)
            keyRects[k.id] = RectF(xStart + padding, y4 + padding, xStart + midW - padding, y4 + rowHeight - padding)
            keyModels[k.id] = k
        }

        val bkspModel = KeyModel(
            id = "key_bksp",
            baseLabel = "⌫",
            displayChar = "⌫",
            action = KeyboardAction.Backspace,
            bgHex = "#30363D",
            textHex = "#F85149",
            isSpecial = true
        )
        keyRects[bkspModel.id] = RectF(width - bkspW + padding, y4 + padding, width - padding, y4 + rowHeight - padding)
        keyModels[bkspModel.id] = bkspModel

        // Hàng 5: [❖ Mode] [ớ] [!] [Space] [:] [✕ Đóng]
        calculateBottomRow(width, rowHeight, padding, isMode = false, isVowel = true)
    }

    // ========================================================
    // 5. TẦNG MA TRẬN DẤU & CHỮ HOA CHO NGUYÊN ÂM ĐÃ CHỌN
    // ========================================================
    private fun calculateVowelMatrixKeys(width: Int, rowHeight: Float, padding: Float) {
        val data = VowelDatabase.DATA[activeVowelKey] ?: return
        val rows = data.rows

        // Vẽ 4 hàng biến thể
        for (rIdx in 0 until minOf(4, rows.size)) {
            val rowDef = rows[rIdx]
            val items = rowDef.items
            val count = items.size
            if (count == 0) continue

            val titleW = width * 0.22f
            val itemW = (width - titleW) / count
            val y = rowHeight * rIdx

            // Title label ở đầu hàng
            val titleModel = KeyModel(
                id = "matrix_title_$rIdx",
                baseLabel = rowDef.title,
                displayChar = rowDef.title,
                action = KeyboardAction.CommitText(""),
                bgHex = "#161B22",
                textHex = "#8B949E",
                textSizeSp = 11f
            )
            keyRects[titleModel.id] = RectF(padding, y + padding, titleW - padding, y + rowHeight - padding)
            keyModels[titleModel.id] = titleModel

            // Các nút biến thể
            val bgCol = when (rIdx) {
                0 -> "#238636"
                1 -> "#0E6B65"
                2 -> "#1F6FEB"
                else -> "#6E40C9"
            }
            for (i in items.indices) {
                val ch = items[i]
                val k = KeyModel("matrix_item_${rIdx}_$i", ch, ch, action = KeyboardAction.CommitText(ch), bgHex = bgCol, textHex = "#FFFFFF", textSizeSp = 18f)
                val xStart = titleW + (i * itemW)
                keyRects[k.id] = RectF(xStart + padding, y + padding, xStart + itemW - padding, y + rowHeight - padding)
                keyModels[k.id] = k
            }
        }

        // Hàng 5: [◀ Quay lại bảng nguyên âm] [✕ Hủy bỏ]
        val y5 = rowHeight * 4
        val backW = width * 0.65f

        val backModel = KeyModel(
            id = "key_back_vowel",
            baseLabel = "◀ Quay lại",
            displayChar = "◀ Quay lại [ớ]",
            action = KeyboardAction.CommitText(""),
            bgHex = "#30363D",
            textHex = "#58A6FF",
            isSpecial = true,
            textSizeSp = 13f
        )
        keyRects[backModel.id] = RectF(padding, y5 + padding, backW - padding, y5 + rowHeight - padding)
        keyModels[backModel.id] = backModel

        val cancelModel = KeyModel(
            id = "key_close_vowel",
            baseLabel = "✕ Hủy",
            displayChar = "✕ Hủy bỏ",
            action = KeyboardAction.CommitText(""),
            bgHex = "#DA3633",
            textHex = "#FFFFFF",
            isSpecial = true,
            textSizeSp = 13f
        )
        keyRects[cancelModel.id] = RectF(backW + padding, y5 + padding, width - padding, y5 + rowHeight - padding)
        keyModels[cancelModel.id] = cancelModel
    }

    // ========================================================
    // HÀNG 5 DÙNG CHUNG (TỐI ƯU HÓA KHÔNG GIAN THEO TẦNG)
    // ========================================================
    private fun calculateBottomRow(width: Int, rowHeight: Float, padding: Float, isMode: Boolean, isVowel: Boolean, yOffset: Float = rowHeight * 4f) {
        val y5 = yOffset

        val vowelLabel = if (isKeepVowelLayer) "ớ 🔒" else "ớ"
        val vowelBg = when {
            isKeepVowelLayer -> "#2EA043"
            isVowel -> "#238636"
            else -> "#30363D"
        }
        val vowelText = if (isKeepVowelLayer || isVowel) "#FFFFFF" else "#3FB950"

        val modeLabel = if (isKeepModeLayer) "❖ 🔒" else "❖ Mode"
        val modeBg = when {
            isKeepModeLayer -> "#1F6FEB"
            isMode -> "#1F6FEB"
            else -> "#30363D"
        }
        val modeText = if (isKeepModeLayer || isMode) "#FFFFFF" else "#58A6FF"

        if (isVowel) {
            // Tầng [ớ]: [❖ Mode: 0.12] [ớ: 0.11] [, : 0.10] [Space: 0.33] [. : 0.10] [🔍: 0.10] [↵: 0.14] = 1.00
            val commaDisplay = if (isShiftActive || isCapsLock) "'" else ","
            val commaSub = if (isShiftActive || isCapsLock) "," else "'"
            val dotDisplay = if (isShiftActive || isCapsLock) "…" else "."
            val dotSub = if (isShiftActive || isCapsLock) "." else "…"

            val defs = listOf(
                KeyModel("key_mode_toggle", "❖", if (isKeepModeLayer) "❖ 🔒" else "❖", action = KeyboardAction.CommitText(""), bgHex = modeBg, textHex = modeText, isSpecial = true),
                KeyModel("key_vowel_toggle", "ớ", vowelLabel, action = KeyboardAction.CommitText(""), bgHex = vowelBg, textHex = vowelText, isSpecial = true, textSizeSp = if (isKeepVowelLayer) 14f else 18f),
                KeyModel("vowel_4_1", commaDisplay, commaDisplay, subLabel = commaSub, action = KeyboardAction.CommitText(commaDisplay), bgHex = "#1D3B2F", textHex = "#7EE787", textSizeSp = 18f),
                KeyModel("space", "Space", "Space", subLabel = currentIOMode.badge, action = KeyboardAction.CommitText(" "), bgHex = "#2D333B", textHex = "#E6EDF3", textSizeSp = 14f),
                KeyModel("vowel_4_3", dotDisplay, dotDisplay, subLabel = dotSub, action = KeyboardAction.CommitText(dotDisplay), bgHex = "#1D3B2F", textHex = "#7EE787", textSizeSp = 18f),
                KeyModel("search", "Search", "🔍", action = KeyboardAction.Search, bgHex = if (isNativeSearchContext) "#1F6FEB" else "#30363D", textHex = "#FFFFFF", isSpecial = true),
                KeyModel("enter", "Enter", "↵", action = KeyboardAction.Enter, bgHex = "#238636", textHex = "#FFFFFF", isSpecial = true)
            )
            val weights = listOf(0.12f, 0.11f, 0.10f, 0.33f, 0.10f, 0.10f, 0.14f)
            var curX = 0f
            for (idx in defs.indices) {
                val k = defs[idx]
                val keyW = width * weights[idx]
                keyRects[k.id] = RectF(curX + padding, y5 + padding, curX + keyW - padding, y5 + rowHeight - padding)
                keyModels[k.id] = k
                curX += keyW
            }
        } else if (isMode) {
            // Tầng Mode: đồng bộ 100% tỉ lệ % kích thước phím với Hàng đáy Normal
            val defs = listOf(
                KeyModel("key_mode_toggle", "❖", modeLabel, action = KeyboardAction.CommitText(""), bgHex = modeBg, textHex = modeText, isSpecial = true, textSizeSp = 12f),
                KeyModel("key_vowel_toggle", "ớ", vowelLabel, action = KeyboardAction.CommitText(""), bgHex = vowelBg, textHex = vowelText, isSpecial = true, textSizeSp = if (isKeepVowelLayer) 13f else 15f),
                KeyModel("mode_bottom_blank_left", "·", "·", subLabel = ",", action = KeyboardAction.CommitText(""), bgHex = "#161B22", textHex = "#484F58", isSpecial = true),
                KeyModel("space", "Select All", "Select All", action = KeyboardAction.SelectAll, bgHex = "#1F6FEB", textHex = "#FFFFFF", isSpecial = true, textSizeSp = 13.5f),
                KeyModel("mode_bottom_blank_right", "·", "·", subLabel = ".", action = KeyboardAction.CommitText(""), bgHex = "#161B22", textHex = "#484F58", isSpecial = true),
                KeyModel("search", "Search", "🔍", action = KeyboardAction.Search, bgHex = if (isNativeSearchContext) "#1F6FEB" else "#30363D", textHex = "#FFFFFF", isSpecial = true),
                KeyModel("enter", "Enter", "↵", action = KeyboardAction.Enter, bgHex = "#238636", textHex = "#FFFFFF", isSpecial = true)
            )
            val weights = listOf(0.12f, 0.11f, 0.10f, 0.33f, 0.10f, 0.10f, 0.14f)
            var curX = 0f
            for (idx in defs.indices) {
                val k = defs[idx]
                val keyW = width * weights[idx]
                keyRects[k.id] = RectF(curX + padding, y5 + padding, curX + keyW - padding, y5 + rowHeight - padding)
                keyModels[k.id] = k
                curX += keyW
            }
        } else {
            // Tầng Normal: [❖ Mode: 12%] [ớ: 11%] [, / ': 10%] [Space: 33%] [. / …: 10%] [🔍: 10%] [↵: 14%] = 1.00
            val commaDisplay = if (isShiftActive || isCapsLock) "'" else ","
            val commaSub = if (isShiftActive || isCapsLock) "," else "'"
            val dotDisplay = if (isShiftActive || isCapsLock) "…" else "."
            val dotSub = if (isShiftActive || isCapsLock) "." else "…"

            val defs = listOf(
                KeyModel("key_mode_toggle", "❖", modeLabel, action = KeyboardAction.CommitText(""), bgHex = modeBg, textHex = modeText, isSpecial = true, textSizeSp = 12f),
                KeyModel("key_vowel_toggle", "ớ", vowelLabel, action = KeyboardAction.CommitText(""), bgHex = vowelBg, textHex = vowelText, isSpecial = true, textSizeSp = if (isKeepVowelLayer) 13f else 15f),
                KeyModel("norm_4_1", commaDisplay, commaDisplay, subLabel = commaSub, action = KeyboardAction.CommitText(commaDisplay), textSizeSp = 17f),
                KeyModel("space", "Space", "Space", subLabel = currentIOMode.badge, action = KeyboardAction.CommitText(" "), bgHex = "#2D333B", textHex = "#E6EDF3", textSizeSp = 13f),
                KeyModel("norm_4_3", dotDisplay, dotDisplay, subLabel = dotSub, action = KeyboardAction.CommitText(dotDisplay), textSizeSp = 17f),
                KeyModel("search", "Search", "🔍", action = KeyboardAction.Search, bgHex = if (isNativeSearchContext) "#1F6FEB" else "#30363D", textHex = "#FFFFFF", isSpecial = true),
                KeyModel("enter", "Enter", "↵", action = KeyboardAction.Enter, bgHex = "#238636", textHex = "#FFFFFF", isSpecial = true)
            )
            val weights = listOf(0.12f, 0.11f, 0.10f, 0.33f, 0.10f, 0.10f, 0.14f)
            var curX = 0f
            for (idx in defs.indices) {
                val k = defs[idx]
                val keyW = width * weights[idx]
                keyRects[k.id] = RectF(curX + padding, y5 + padding, curX + keyW - padding, y5 + rowHeight - padding)
                keyModels[k.id] = k
                curX += keyW
            }
        }
    }
    fun openWordMacroMatrix(keyId: String) {
        val gridKey = getGridKey(keyId) ?: return
        openWordMacroForChar(gridKey)
    }

    fun openWordMacroForChar(charStr: String) {
        val key = charStr.lowercase()
        val macros = FastMacroDatabase.getMacrosForKey(context, key)
        if (macros.isNotEmpty()) {
            activeMacroKey = key
            setLayer(KeyboardLayer.MACRO_PALETTE)
            performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
        }
    }

    fun closeWordMacroMatrix() {
        activeMacroKey = ""
        setLayer(KeyboardLayer.NORMAL)
    }

    private fun cancelHoldTimer() {
        holdRunnable?.let { holdHandler.removeCallbacks(it) }
        holdRunnable = null
    }

    private fun getFlick6Direction(dx: Float, dy: Float): Int {
        val angle = Math.toDegrees(kotlin.math.atan2(dy.toDouble(), dx.toDouble())).toFloat()
        // 0: Sắc (Up: -115 to -45)
        // 2: Hỏi (Right: -45 to 15)
        // 5: Gốc TV (Down-Right: 15 to 65)
        // 4: Nặng (Down: 65 to 115)
        // 3: Ngã (Down-Left: 115 to 160)
        // 1: Huyền (Left: 160..180 or -180..-115) -> Bao trọn cả quệt ngang trái và hất chéo lên-trái của ngón cái
        return when {
            angle >= -115f && angle < -45f -> 0
            angle >= -45f && angle < 15f -> 2
            angle >= 15f && angle < 65f -> 5
            angle >= 65f && angle < 115f -> 4
            angle >= 115f && angle < 160f -> 3
            else -> 1
        }
    }

    private fun getKeyGridCoords(id: String): Pair<Int, Int>? {
        val parts = id.split("_")
        if (parts.size >= 3) {
            val r = parts[1].toIntOrNull()
            val c = parts[2].toIntOrNull()
            if (r != null && c != null) return Pair(r, c)
        }
        return null
    }

    private fun getGridKey(keyId: String): String? {
        val model = keyModels[keyId]
        val chip = model?.chipDef
        if (chip != null) return chip.char
        if (model?.subLabel != null && model.id.startsWith("vowel_")) {
            return model.subLabel
        }
        val coords = getKeyGridCoords(keyId) ?: return null
        val (r, c) = coords
        return when (r) {
            0 -> listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "0").getOrNull(c)
            1 -> listOf("q", "w", "e", "r", "t", "y", "u", "i", "o", "p").getOrNull(c)
            2 -> listOf("a", "s", "d", "f", "g", "h", "j", "k", "l").getOrNull(c)
            3 -> {
                if (c in 1..7) listOf("z", "x", "c", "v", "b", "n", "m").getOrNull(c - 1) else null
            }
            else -> null
        }
    }

    private fun getMacroColor(label: String): Pair<String, String> {
        val isLevel4 = label.any { it.isDigit() } || label.contains(" ")
        val isLevel2 = label.isNotEmpty() && label[0].isUpperCase()
        val isLevel3 = label.length >= 2 && !isLevel2 && !isLevel4 && label.none { it in "aeiouyáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ" }
        return when {
            isLevel4 -> Pair("#441C22", "#FF7B72") // Cấp 4: Khẩu hiệu / Cụm >= 5 từ (Đỏ hồng)
            isLevel3 -> Pair("#3E2612", "#FFA657") // Cấp 3: Viết tắt 3-4 từ (Cam hổ phách)
            isLevel2 -> Pair("#162C46", "#79C0FF") // Cấp 2: Từ ghép 2 từ (Xanh dương)
            else -> Pair("#163326", "#7EE787")     // Cấp 1: Từ đơn 1 từ (Xanh lá tươi)
        }
    }

    private fun getMacroItemWeight(label: String): Float {
        return when {
            label.length <= 2 -> 1.0f
            label.length == 3 -> 1.25f
            label.length in 4..5 -> 1.5f
            else -> 1.8f
        }
    }

    private fun calculateMacroKeys(width: Int, rowHeight: Float, padding: Float) {
        val macros = FastMacroDatabase.getMacrosForKey(context, activeMacroKey)
        if (macros.isEmpty()) {
            calculateBottomRow(width, rowHeight, padding, isMode = false, isVowel = false)
            return
        }

        // Bố cục co giãn động theo độ dài nhãn (Adaptive Label-Length Flow) trên 4 hàng:
        var macroIndex = 0
        val totalMacros = macros.size

        // Hàng 1, 2, 3: Chiều rộng 100%
        for (rowIndex in 0..2) {
            if (macroIndex >= totalMacros) break
            val rowItems = mutableListOf<MacroItem>()
            var currentWeight = 0f
            val targetWeight = 9.8f

            while (macroIndex < totalMacros) {
                val item = macros[macroIndex]
                val w = getMacroItemWeight(item.label)
                if (rowItems.isNotEmpty() && currentWeight + w > targetWeight && rowItems.size >= 7) {
                    break
                }
                rowItems.add(item)
                currentWeight += w
                macroIndex++
                if (currentWeight >= 11.5f || rowItems.size >= 12) break
            }

            if (rowItems.isNotEmpty()) {
                val y = rowHeight * rowIndex
                var curX = 0f
                for (colIndex in rowItems.indices) {
                    val item = rowItems[colIndex]
                    val itemW = width * (getMacroItemWeight(item.label) / currentWeight)
                    val (bg, text) = getMacroColor(item.label)
                    val textSize = if (item.label.length > 4) 11.5f else 13.5f
                    val k = KeyModel("macro_${rowIndex}_$colIndex", item.label, item.label, action = KeyboardAction.CommitText(item.fullText), bgHex = bg, textHex = text, textSizeSp = textSize)
                    keyRects[k.id] = RectF(curX + padding, y + padding, curX + itemW - padding, y + rowHeight - padding)
                    keyModels[k.id] = k
                    curX += itemW
                }
            }
        }

        // Hàng 4: Từ còn lại + [⚙ Cấu hình] (11%) + [✕ Đóng] (11%)
        val y4 = rowHeight * 3
        val settingsW = width * 0.11f
        val closeW = width * 0.11f
        val availableW4 = width - settingsW - closeW

        val r4Items = mutableListOf<MacroItem>()
        var r4Weight = 0f
        val maxR4Weight = 7.8f

        while (macroIndex < totalMacros) {
            val item = macros[macroIndex]
            val w = getMacroItemWeight(item.label)
            if (r4Items.isNotEmpty() && r4Weight + w > maxR4Weight && r4Items.size >= 5) {
                break
            }
            r4Items.add(item)
            r4Weight += w
            macroIndex++
            if (r4Weight >= 9.0f || r4Items.size >= 9) break
        }

        var curX4 = 0f
        if (r4Items.isNotEmpty()) {
            for (colIndex in r4Items.indices) {
                val item = r4Items[colIndex]
                val itemW = availableW4 * (getMacroItemWeight(item.label) / r4Weight)
                val (bg, text) = getMacroColor(item.label)
                val textSize = if (item.label.length > 4) 11.5f else 13.5f
                val k = KeyModel("macro_3_$colIndex", item.label, item.label, action = KeyboardAction.CommitText(item.fullText), bgHex = bg, textHex = text, textSizeSp = textSize)
                keyRects[k.id] = RectF(curX4 + padding, y4 + padding, curX4 + itemW - padding, y4 + rowHeight - padding)
                keyModels[k.id] = k
                curX4 += itemW
            }
        } else {
            curX4 = availableW4
        }

        // Nút Cài đặt [⚙]
        val settingsModel = KeyModel(
            id = "key_macro_settings",
            baseLabel = "⚙",
            displayChar = "⚙",
            action = KeyboardAction.CommitText(""),
            bgHex = "#21262D",
            textHex = "#58A6FF",
            isSpecial = true,
            textSizeSp = 16f
        )
        keyRects[settingsModel.id] = RectF(curX4 + padding, y4 + padding, curX4 + settingsW - padding, y4 + rowHeight - padding)
        keyModels[settingsModel.id] = settingsModel
        curX4 += settingsW

        // Nút [✕ Đóng]
        val closeModel = KeyModel(
            id = "key_close_macro",
            baseLabel = "✕",
            displayChar = "✕",
            action = KeyboardAction.CommitText(""),
            bgHex = "#DA3633",
            textHex = "#FFFFFF",
            isSpecial = true,
            textSizeSp = 16f
        )
        keyRects[closeModel.id] = RectF(curX4 + padding, y4 + padding, width.toFloat() - padding, y4 + rowHeight - padding)
        keyModels[closeModel.id] = closeModel

        // Hàng 5: Hàng 5 dùng chung
        calculateBottomRow(width, rowHeight, padding, isMode = false, isVowel = false)
    }

    private fun handleFlickAction(keyId: String, dx: Float, dy: Float) {
        val gridKey = getGridKey(keyId) ?: return
        val targetVowel = VowelDatabase.KEY_TO_VOWEL_MAPPING[gridKey] ?: gridKey
        val dir = getFlick6Direction(dx, dy)

        // Rung Haptic phản hồi khi quệt trúng hướng
        performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)

        // 1. Phụ âm kép (z / ngh hoặc d / đ...):
        val clusterDef = VowelDatabase.CONSONANT_CLUSTERS[targetVowel]
        if (clusterDef != null) {
            if (dir == 5) {
                // Hướng Xuống-Phải ↘️: Ra chính phụ âm kép / ký tự gốc 'ngh' / 'đ' (Shift: 'Ngh' / 'Đ')
                val baseCluster = if (isShiftActive || isCapsLock) clusterDef.base.replaceFirstChar { it.uppercase() } else clusterDef.base
                onAction?.invoke(KeyboardAction.CommitText(baseCluster))
            } else {
                val clusters = if (isShiftActive || isCapsLock) clusterDef.uppers else clusterDef.clusters
                val chosen = clusters.getOrNull(dir) ?: clusters[0]
                onAction?.invoke(KeyboardAction.CommitText(chosen))
            }
            if (!isCapsLock && isShiftActive) {
                isShiftActive = false
                calculateKeys(width, height)
            }
            if (!isKeepVowelLayer && (currentLayer == KeyboardLayer.VOWEL_SELECTOR || currentLayer == KeyboardLayer.VOWEL_MATRIX)) {
                setLayer(KeyboardLayer.NORMAL)
            }
            return
        }

        // 2. Hướng 5 (Xuống-Phải ↘️): Ăn ngay Nguyên âm / Cụm tiếng Việt gốc (ô, ư, ơ, ê, â, ă, uâ, iê...) 0ms!
        if (dir == 5) {
            var baseVowel = targetVowel
            if (isShiftActive || isCapsLock) {
                baseVowel = if (baseVowel.length > 1) {
                    baseVowel.replaceFirstChar { it.uppercase() }
                } else {
                    baseVowel.uppercase()
                }
            }
            onAction?.invoke(KeyboardAction.CommitText(baseVowel))
            if (!isCapsLock && isShiftActive) {
                isShiftActive = false
                calculateKeys(width, height)
            }
            if (!isKeepVowelLayer && (currentLayer == KeyboardLayer.VOWEL_SELECTOR || currentLayer == KeyboardLayer.VOWEL_MATRIX)) {
                setLayer(KeyboardLayer.NORMAL)
            }
            return
        }

        // 3. Nguyên âm: Quệt theo 5 hướng còn lại ăn ngay 5 dấu thanh tức thì (0ms latency)!
        val toneDef = VowelDatabase.TONE_DATABASE[targetVowel]
        if (toneDef != null) {
            val tones = if (isShiftActive || isCapsLock) toneDef.uppers else toneDef.tones
            val chosenChar = tones.getOrNull(dir) ?: tones[0]
            onAction?.invoke(KeyboardAction.CommitText(chosenChar))
            if (!isCapsLock && isShiftActive) {
                isShiftActive = false
                calculateKeys(width, height)
            }
            if (!isKeepVowelLayer && (currentLayer == KeyboardLayer.VOWEL_SELECTOR || currentLayer == KeyboardLayer.VOWEL_MATRIX)) {
                setLayer(KeyboardLayer.NORMAL)
            }
            return
        }

        // Nếu không có ánh xạ, commit phím bình thường
        val model = keyModels[keyId]
        if (model != null) {
            onAction?.invoke(model.action)
        }
    }

    private fun getFlickCharacters(keyId: String): List<String> {
        val gridKey = getGridKey(keyId) ?: return emptyList()
        val targetVowel = VowelDatabase.KEY_TO_VOWEL_MAPPING[gridKey] ?: gridKey

        val clusterDef = VowelDatabase.CONSONANT_CLUSTERS[targetVowel]
        if (clusterDef != null) {
            val clusters = if (isShiftActive || isCapsLock) clusterDef.uppers else clusterDef.clusters
            val base = if (isShiftActive || isCapsLock) clusterDef.base.replaceFirstChar { it.uppercase() } else clusterDef.base
            return listOf(
                clusters.getOrElse(0) { "" },
                clusters.getOrElse(1) { "" },
                clusters.getOrElse(2) { "" },
                clusters.getOrElse(3) { "" },
                clusters.getOrElse(4) { "" },
                base
            )
        }

        val toneDef = VowelDatabase.TONE_DATABASE[targetVowel]
        if (toneDef != null) {
            val tones = if (isShiftActive || isCapsLock) toneDef.uppers else toneDef.tones
            val baseVowel = if (isShiftActive || isCapsLock) {
                if (targetVowel.length > 1) targetVowel.replaceFirstChar { it.uppercase() } else targetVowel.uppercase()
            } else targetVowel
            return listOf(
                tones.getOrElse(0) { "" },
                tones.getOrElse(1) { "" },
                tones.getOrElse(2) { "" },
                tones.getOrElse(3) { "" },
                tones.getOrElse(4) { "" },
                baseVowel
            )
        }

        return emptyList()
    }

    private fun drawFlickCompassHUD(canvas: Canvas) {
        val keyId = pressedKeyId ?: return
        val rect = keyRects[keyId] ?: return
        val model = keyModels[keyId] ?: return

        val density = resources.displayMetrics.scaledDensity
        val hudRadius = 72f * density
        val orbitRadius = 48f * density

        val hudX = rect.centerX().coerceIn(hudRadius + 8f, width - hudRadius - 8f)
        val aboveY = rect.top - hudRadius - 14f
        val hudY = if (aboveY - hudRadius < 6f) (rect.bottom + hudRadius + 14f).coerceAtMost(height - hudRadius - 6f) else aboveY

        // 1. Vòng tròn nền bán trong suốt Dark Theme
        canvas.drawCircle(hudX, hudY, hudRadius, hudBgPaint)
        canvas.drawCircle(hudX, hudY, hudRadius, hudBorderPaint)

        // 2. Tâm la bàn
        val centerLabel = model.displayChar
        canvas.drawCircle(hudX, hudY, 14f * density, hudCenterPaint)
        hudTextPaint.color = Color.parseColor("#FFFFFF")
        hudTextPaint.textSize = (if (centerLabel.length > 2) 10f else 13f) * density
        hudTextPaint.isFakeBoldText = true
        val cFm = hudTextPaint.fontMetrics
        val cY = hudY - (cFm.ascent + cFm.descent) / 2
        canvas.drawText(centerLabel, hudX, cY, hudTextPaint)

        // Nếu là phím chip: vẽ 8 hướng bằng FlickCompassEngine
        val chip = model.chipDef
        if (chip != null) {
            val gridKey = getGridKey(keyId) ?: chip.char
            val tutorMatchedRhyme = if (gridKey != null) rhymeTutorHighlights[gridKey] else null

            val tutorLabels = if (tutorMatchedRhyme != null) {
                mapOf(
                    FlickDirection.SAC to RhymeTutorEngine.applyTone(tutorMatchedRhyme, 1),
                    FlickDirection.HUYEN to RhymeTutorEngine.applyTone(tutorMatchedRhyme, 2),
                    FlickDirection.HOI to RhymeTutorEngine.applyTone(tutorMatchedRhyme, 3),
                    FlickDirection.NGA to RhymeTutorEngine.applyTone(tutorMatchedRhyme, 4),
                    FlickDirection.NANG to RhymeTutorEngine.applyTone(tutorMatchedRhyme, 5),
                    FlickDirection.BANG to RhymeTutorEngine.applyTone(tutorMatchedRhyme, 0)
                )
            } else null

            val baseLabels = FlickCompassEngine.getCompassLabels(chip, isShiftActive || isCapsLock)
            val labels = if (tutorLabels != null) baseLabels + tutorLabels else baseLabels

            val dirAngles = listOf(
                FlickDirection.SAC to -90.0,
                FlickDirection.HOI to -45.0,
                FlickDirection.BANG to 0.0,
                FlickDirection.SC1 to 45.0,
                FlickDirection.NANG to 90.0,
                FlickDirection.SC2 to 135.0,
                FlickDirection.NGA to 180.0,
                FlickDirection.HUYEN to -135.0
            )

            // Tia sáng kết nối từ tâm đến hướng đang được quệt
            if (currentFlickEngineDir != null) {
                val matched = dirAngles.firstOrNull { it.first == currentFlickEngineDir }
                val angleDeg = matched?.second ?: 0.0
                val rad = Math.toRadians(angleDeg)
                val ax = hudX + (orbitRadius * Math.cos(rad)).toFloat()
                val ay = hudY + (orbitRadius * Math.sin(rad)).toFloat()
                canvas.drawLine(hudX, hudY, ax, ay, hudRayPaint)
            }

            // Vẽ 8 nút cánh hoa la bàn
            for ((dir, angleDeg) in dirAngles) {
                val label = labels[dir] ?: ""
                if (label.isEmpty()) continue

                val rad = Math.toRadians(angleDeg)
                val px = hudX + (orbitRadius * Math.cos(rad)).toFloat()
                val py = hudY + (orbitRadius * Math.sin(rad)).toFloat()
                val isActive = (dir == currentFlickEngineDir)

                if (isActive) {
                    val nodeR = 15f * density
                    hudActivePaint.color = when (dir) {
                        FlickDirection.BANG -> Color.parseColor("#238636") // Tone bằng / vần 2
                        FlickDirection.SC1,
                        FlickDirection.SC2 -> Color.parseColor("#D29922") // sc1, sc2
                        else -> Color.parseColor("#1F6FEB") // Dấu thanh
                    }
                    canvas.drawCircle(px, py, nodeR, hudActivePaint)
                    canvas.drawCircle(px, py, nodeR, hudActiveBorderPaint)

                    hudTextPaint.color = Color.parseColor("#FFFFFF")
                    hudTextPaint.textSize = (if (label.length > 2) 10f else 13f) * density
                    hudTextPaint.isFakeBoldText = true
                    val fm = hudTextPaint.fontMetrics
                    val textY = py - (fm.ascent + fm.descent) / 2
                    canvas.drawText(label, px, textY, hudTextPaint)
                } else {
                    val nodeR = 11f * density
                    canvas.drawCircle(px, py, nodeR, hudInactivePaint)

                    hudTextPaint.color = when (dir) {
                        FlickDirection.BANG -> Color.parseColor("#3FB950") // Green hint
                        FlickDirection.SC1,
                        FlickDirection.SC2 -> Color.parseColor("#FFA657") // Amber hint
                        else -> Color.parseColor("#8B949E")
                    }
                    hudTextPaint.textSize = (if (label.length > 2) 8.5f else 10.5f) * density
                    hudTextPaint.isFakeBoldText = (dir == FlickDirection.BANG)
                    val fm = hudTextPaint.fontMetrics
                    val textY = py - (fm.ascent + fm.descent) / 2
                    canvas.drawText(label, px, textY, hudTextPaint)
                }
            }
            return
        }

        // Fallback: 6 hướng cho các tầng phi-chip (Vowel, v.v.)
        val flickChars = getFlickCharacters(keyId)
        if (flickChars.isEmpty()) return

        val p0 = Pair(hudX, hudY - orbitRadius)
        val p1 = Pair(hudX - orbitRadius, hudY)
        val p2 = Pair(hudX + orbitRadius, hudY)
        val p3 = Pair(hudX - orbitRadius * 0.707f, hudY + orbitRadius * 0.707f)
        val p4 = Pair(hudX, hudY + orbitRadius)
        val p5 = Pair(hudX + orbitRadius * 0.707f, hudY + orbitRadius * 0.707f)
        val positions = listOf(p0, p1, p2, p3, p4, p5)

        if (currentFlickDir in 0..5) {
            val activePos = positions[currentFlickDir]
            canvas.drawLine(hudX, hudY, activePos.first, activePos.second, hudRayPaint)
        }

        for (i in 0..5) {
            val pos = positions[i]
            val charStr = flickChars.getOrNull(i) ?: ""
            if (charStr.isEmpty()) continue
            val isActive = (i == currentFlickDir)

            if (isActive) {
                val nodeR = 15f * density
                hudActivePaint.color = if (i == 5) Color.parseColor("#238636") else Color.parseColor("#1F6FEB")
                canvas.drawCircle(pos.first, pos.second, nodeR, hudActivePaint)
                canvas.drawCircle(pos.first, pos.second, nodeR, hudActiveBorderPaint)

                hudTextPaint.color = Color.parseColor("#FFFFFF")
                hudTextPaint.textSize = (if (charStr.length > 2) 10f else 13f) * density
                hudTextPaint.isFakeBoldText = true
                val fm = hudTextPaint.fontMetrics
                val textY = pos.second - (fm.ascent + fm.descent) / 2
                canvas.drawText(charStr, pos.first, textY, hudTextPaint)
            } else {
                val nodeR = 10.5f * density
                canvas.drawCircle(pos.first, pos.second, nodeR, hudInactivePaint)

                hudTextPaint.color = Color.parseColor("#8B949E")
                hudTextPaint.textSize = (if (charStr.length > 2) 8.5f else 10.5f) * density
                hudTextPaint.isFakeBoldText = false
                val fm = hudTextPaint.fontMetrics
                val textY = pos.second - (fm.ascent + fm.descent) / 2
                canvas.drawText(charStr, pos.first, textY, hudTextPaint)
            }
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val isSearching = (currentLayer == KeyboardLayer.SEARCH)

        for ((id, rect) in keyRects) {
            val model = keyModels[id] ?: continue
            val isPressed = (id == pressedKeyId)

            if (isSearching && (id.startsWith("search_s_") || id.startsWith("search_0_") || id.startsWith("search_1_") || id.startsWith("search_2_") || id.startsWith("search_3_"))) {
                val isMatched = isRhymeMatched(model.displayChar, searchQuery, isFilter2c, isFilter3c, isSearchMatchAnywhere)
                val keyChar = model.subLabel?.firstOrNull()
                val hiddenMatch = if (keyChar != null) getHiddenRhymeMatch(keyChar, searchQuery, isSearchMatchAnywhere) else null
                val density = resources.displayMetrics.density

                if (searchQuery.isNotEmpty()) {
                    if (isMatched) {
                        // SÁNG RỰC RỠ VẦN LỘ: Nền xanh ngọc đậm / viền cam neon
                        keyPaint.color = Color.parseColor("#1B4D3E")
                        canvas.drawRoundRect(rect, 14f, 14f, keyPaint)
                        keyBorderPaint.color = Color.parseColor("#F0883E")
                        keyBorderPaint.strokeWidth = 3f * density
                        canvas.drawRoundRect(rect, 14f, 14f, keyBorderPaint)

                        // Chữ vần ở giữa to, đậm, trắng tinh
                        textPaint.color = Color.parseColor("#FFFFFF")
                        textPaint.textSize = model.textSizeSp * resources.displayMetrics.scaledDensity
                        textPaint.isFakeBoldText = true
                        val fm = textPaint.fontMetrics
                        val centerY = rect.centerY() - (fm.ascent + fm.descent) / 2
                        canvas.drawText(model.displayChar, rect.centerX(), centerY, textPaint)

                        // Ký tự phím ở góc
                        if (model.subLabel != null) {
                            subTextPaint.color = Color.parseColor("#7EE787")
                            subTextPaint.textSize = 10f * resources.displayMetrics.scaledDensity
                            canvas.drawText(model.subLabel, rect.left + 8f, rect.top + 20f, subTextPaint)
                        }
                    } else if (hiddenMatch != null) {
                        // SÁNG RỰC RỠ VẦN ẨN BASE60: Nền tím sapphire / viền vàng kim Base60 rực rỡ
                        keyPaint.color = Color.parseColor("#271C48")
                        canvas.drawRoundRect(rect, 14f, 14f, keyPaint)
                        keyBorderPaint.color = Color.parseColor("#E3B341") // Vàng kim Base60
                        keyBorderPaint.strokeWidth = 3.2f * density
                        canvas.drawRoundRect(rect, 14f, 14f, keyBorderPaint)

                        // Chữ vần ẩn ở giữa: Màu vàng kim sáng, to, rõ
                        textPaint.color = Color.parseColor("#F2CC60")
                        val dispRhyme = hiddenMatch.rhyme
                        val rhymeTextSize = if (dispRhyme.length > 3) 12f else 15f
                        textPaint.textSize = rhymeTextSize * resources.displayMetrics.scaledDensity
                        textPaint.isFakeBoldText = true
                        val fm = textPaint.fontMetrics
                        val centerY = rect.centerY() - (fm.ascent + fm.descent) / 2 - (3f * density)
                        canvas.drawText(dispRhyme, rect.centerX(), centerY, textPaint)

                        // Ký tự phím ở góc trên bên trái: Màu xanh dương nổi bật
                        val keyTag = "${hiddenMatch.keyChar}"
                        subTextPaint.color = Color.parseColor("#58A6FF")
                        subTextPaint.textSize = 11f * resources.displayMetrics.scaledDensity
                        subTextPaint.isFakeBoldText = true
                        canvas.drawText(keyTag, rect.left + 8f, rect.top + 20f, subTextPaint)

                        // Từ mẫu ghi nhớ ở góc dưới (ví dụ "việt"): Màu xám sáng
                        if (hiddenMatch.word.isNotEmpty()) {
                            subTextPaint.color = Color.parseColor("#C9D1D9")
                            subTextPaint.textSize = 9.5f * resources.displayMetrics.scaledDensity
                            subTextPaint.isFakeBoldText = false
                            val wordWidth = subTextPaint.measureText(hiddenMatch.word)
                            canvas.drawText(hiddenMatch.word, rect.right - wordWidth - 6f, rect.bottom - 6f, subTextPaint)
                        }
                    } else {
                        // PHÍM KHÔNG KHỚP: VẪN SÁNG RÕ CHỮ CÁI QWERTY ĐỂ NGƯỜI DÙNG DỄ GÕ TRA CỨU TIẾP!
                        keyPaint.color = Color.parseColor("#21262D")
                        canvas.drawRoundRect(rect, 14f, 14f, keyPaint)
                        keyBorderPaint.color = Color.parseColor("#30363D")
                        keyBorderPaint.strokeWidth = 1f * density
                        canvas.drawRoundRect(rect, 14f, 14f, keyBorderPaint)

                        // Vần ở giữa mờ vừa phải
                        textPaint.color = Color.parseColor("#6E7681")
                        textPaint.textSize = model.textSizeSp * resources.displayMetrics.scaledDensity
                        textPaint.isFakeBoldText = false
                        val fm = textPaint.fontMetrics
                        val centerY = rect.centerY() - (fm.ascent + fm.descent) / 2
                        canvas.drawText(model.displayChar, rect.centerX(), centerY, textPaint)

                        // KÝ TỰ PHÍM QWERTY Ở GÓC: TRẮNG SÁNG, ĐẬM, CỰC KỲ DỄ NHÌN!
                        if (model.subLabel != null) {
                            subTextPaint.color = Color.parseColor("#E6EDF3")
                            subTextPaint.textSize = 12f * resources.displayMetrics.scaledDensity
                            subTextPaint.isFakeBoldText = true
                            canvas.drawText(model.subLabel, rect.left + 8f, rect.top + 20f, subTextPaint)
                        }
                    }
                } else {
                    // Chưa gõ search query: Vẽ bình thường như tầng ớ
                    keyPaint.color = if (isPressed) Color.parseColor("#484F58") else Color.parseColor(model.bgHex)
                    canvas.drawRoundRect(rect, 14f, 14f, keyPaint)
                    keyBorderPaint.color = Color.parseColor("#373E47")
                    keyBorderPaint.strokeWidth = 1f * density
                    canvas.drawRoundRect(rect, 14f, 14f, keyBorderPaint)

                    textPaint.color = Color.parseColor(model.textHex)
                    textPaint.textSize = model.textSizeSp * resources.displayMetrics.scaledDensity
                    textPaint.isFakeBoldText = model.isSpecial
                    val fm = textPaint.fontMetrics
                    val centerY = rect.centerY() - (fm.ascent + fm.descent) / 2
                    canvas.drawText(model.displayChar, rect.centerX(), centerY, textPaint)

                    if (model.subLabel != null) {
                        subTextPaint.color = Color.parseColor("#8B949E")
                        subTextPaint.textSize = 10f * resources.displayMetrics.scaledDensity
                        canvas.drawText(model.subLabel, rect.left + 8f, rect.top + 20f, subTextPaint)
                    }
                }
                continue
            }

            // Vẽ phím
            keyPaint.color = if (isPressed) Color.parseColor("#484F58") else Color.parseColor(model.bgHex)
            canvas.drawRoundRect(rect, 14f, 14f, keyPaint)
            keyBorderPaint.color = Color.parseColor("#373E47")
            canvas.drawRoundRect(rect, 14f, 14f, keyBorderPaint)

            // ĐÈN CHỈ ĐIỂM VẦN (RHYME TUTOR HIGHLIGHT):
            val gridKey = getGridKey(id) ?: model.chipDef?.char
            val tutorMatchedRhyme = if (gridKey != null) rhymeTutorHighlights[gridKey] else null
            if (tutorMatchedRhyme != null) {
                val density = resources.displayMetrics.density
                rhymeTutorBorderPaint.strokeWidth = 2.8f * density
                canvas.drawRoundRect(rect, 14f, 14f, rhymeTutorBorderPaint)
            }

            val chip = model.chipDef
            val gInfo = model.guideInfo

            if (chip != null) {
                val density = resources.displayMetrics.density
                val scaledDensity = resources.displayMetrics.scaledDensity

                // 1. Center character (tap)
                chipCenterPaint.textSize = (if (model.displayChar.length > 2) 12f else if (model.displayChar.length > 1) 14f else 16.5f) * scaledDensity
                val fm = chipCenterPaint.fontMetrics
                val centerY = rect.centerY() - (fm.ascent + fm.descent) / 2
                canvas.drawText(model.displayChar, rect.centerX(), centerY, chipCenterPaint)

                // 2. Top-Left: Rhyme (Green / Vàng rực rỡ nếu khớp Rhyme Tutor)
                val displayTl = tutorMatchedRhyme ?: chip.tl
                if (displayTl.isNotEmpty()) {
                    if (tutorMatchedRhyme != null) {
                        rhymeTutorTextPaint.textSize = (if (displayTl.length > 3) 8.5f else 10.5f) * scaledDensity
                        val textY = rect.top + 10.5f * density
                        canvas.drawText(displayTl, rect.left + 3.5f * density, textY, rhymeTutorTextPaint)
                    } else {
                        chipTlPaint.textSize = (if (displayTl.length > 3) 7f else 8.5f) * scaledDensity
                        val textY = rect.top + 10.5f * density
                        canvas.drawText(displayTl, rect.left + 3.5f * density, textY, chipTlPaint)
                    }
                }

                // 3. Top-Right: Base60 (Purple)
                val trStr = chip.tr ?: ""
                if (trStr.isNotEmpty()) {
                    chipTrPaint.textSize = 8.5f * scaledDensity
                    val textY = rect.top + 10.5f * density
                    canvas.drawText(trStr, rect.right - 3.5f * density, textY, chipTrPaint)
                }

                // 4. Bottom-Left: sc2 (Cyan)
                if (chip.bl.isNotEmpty()) {
                    chipBlPaint.textSize = 8f * scaledDensity
                    val textY = rect.bottom - 3.5f * density
                    canvas.drawText(chip.bl, rect.left + 3.5f * density, textY, chipBlPaint)
                }

                // 5. Bottom-Right: sc1 (Amber)
                if (chip.br.isNotEmpty()) {
                    chipBrPaint.textSize = 8f * scaledDensity
                    val textY = rect.bottom - 3.5f * density
                    canvas.drawText(chip.br, rect.right - 3.5f * density, textY, chipBrPaint)
                }
            } else if (gInfo != null) {
                val density = resources.displayMetrics.density
                val scaledDensity = resources.displayMetrics.scaledDensity

                // 1. Ký tự phím ở giữa (Căn giữa tâm nếu không có phụ âm, lệch nhẹ lên nếu có phụ âm)
                val hasConsonant = gInfo.consonant.isNotEmpty()
                textPaint.color = Color.parseColor(model.textHex)
                textPaint.textSize = (if (hasConsonant) 14.5f else 17f) * scaledDensity
                textPaint.isFakeBoldText = true
                val fm = textPaint.fontMetrics
                val charY = if (hasConsonant) {
                    rect.centerY() - 3.5f * density - (fm.ascent + fm.descent) / 2
                } else {
                    rect.centerY() - (fm.ascent + fm.descent) / 2
                }
                canvas.drawText(model.displayChar, rect.centerX(), charY, textPaint)

                // 2. Phụ âm ở giữa (ngay dưới ký tự phím)
                if (gInfo.consonant.isNotEmpty()) {
                    guideConsonantPaint.textSize = 9.5f * scaledDensity
                    val cFm = guideConsonantPaint.fontMetrics
                    val conY = rect.centerY() + 8.5f * density - (cFm.ascent + cFm.descent) / 2
                    canvas.drawText(gInfo.consonant, rect.centerX(), conY, guideConsonantPaint)
                }

                // 3. Góc trên-trái: Vần 1 (Vàng #E3B341)
                if (gInfo.rhyme1.isNotEmpty()) {
                    guideRhyme1Paint.textSize = 8f * scaledDensity
                    canvas.drawText(gInfo.rhyme1, rect.left + 4.5f * density, rect.top + 11.5f * density, guideRhyme1Paint)
                }

                // 4. Góc trên-phải: Vần 2 (Tím #BC8CFF)
                if (gInfo.rhyme2.isNotEmpty()) {
                    guideRhyme2Paint.textSize = 8f * scaledDensity
                    canvas.drawText(gInfo.rhyme2, rect.right - 4.5f * density, rect.top + 11.5f * density, guideRhyme2Paint)
                }

                // 5. Góc dưới-trái: Vần 3 (Cam #FFA657)
                if (gInfo.rhyme3.isNotEmpty()) {
                    guideRhyme3Paint.textSize = 8f * scaledDensity
                    canvas.drawText(gInfo.rhyme3, rect.left + 4.5f * density, rect.bottom - 4.5f * density, guideRhyme3Paint)
                }

                // 6. Góc dưới-phải: Dấu thanh (Hồng #F778BA)
                if (gInfo.tone.isNotEmpty()) {
                    guideTonePaint.textSize = 7.5f * scaledDensity
                    canvas.drawText(gInfo.tone, rect.right - 4.5f * density, rect.bottom - 4.5f * density, guideTonePaint)
                }
            } else {
                if (model.subLabel != null) {
                    subTextPaint.textAlign = Paint.Align.LEFT
                    subTextPaint.color = Color.parseColor("#8B949E")
                    subTextPaint.textSize = 10f * resources.displayMetrics.scaledDensity
                    canvas.drawText(model.subLabel, rect.left + 8f, rect.top + 20f, subTextPaint)
                }

                textPaint.color = Color.parseColor(model.textHex)
                textPaint.textSize = model.textSizeSp * resources.displayMetrics.scaledDensity
                textPaint.isFakeBoldText = model.isSpecial
                val fontMetrics = textPaint.fontMetrics
                val centerY = rect.centerY() - (fontMetrics.ascent + fontMetrics.descent) / 2
                canvas.drawText(model.displayChar, rect.centerX(), centerY, textPaint)
            }
        }

        // Vẽ vệt sáng vuốt chữ Swipe Trail khi vuốt
        if (isSwiping && swipePoints.size > 1) {
            drawSwipeTrail(canvas)
        }

        // Vẽ vệt đỏ xóa lùi khi trượt phím Backspace
        if (isBkspSliding && bkspPoints.size > 1) {
            drawBkspTrail(canvas)
        }

        // Vẽ La bàn Flick Compass HUD nổi thời gian thực khi quệt
        if (isFlicking && pressedKeyId != null) {
            drawFlickCompassHUD(canvas)
        }
    }

    private fun getKeyCharacter(keyId: String?): String? {
        if (keyId == null) return null
        val gridChar = getGridKey(keyId)
        if (gridChar != null) return gridChar
        val model = keyModels[keyId]
        if (model != null && !model.isSpecial && model.displayChar.length == 1) {
            return model.displayChar.lowercase()
        }
        return null
    }

    private fun findSwipeKeyAt(x: Float, y: Float): String? {
        val totalRows = if ((currentLayer == KeyboardLayer.NORMAL || currentLayer == KeyboardLayer.SEARCH) && isRowSymbolsVisible) 6f else 5f
        val rHeight = height / totalRows
        val isBase60 = (currentIOMode == IOMode.B60_TO_VN || currentIOMode == IOMode.B60_TO_B60)
        val swipeTop = if (isBase60) {
            if (isRowSymbolsVisible) 1f * rHeight else 0f * rHeight
        } else {
            if (isRowSymbolsVisible) 2f * rHeight else 1f * rHeight
        }
        val swipeBottom = if (isRowSymbolsVisible) 5f * rHeight else 4f * rHeight

        // Kẹp Y vào phạm vi hàng phím hợp lệ
        val clampedY = y.coerceIn(swipeTop + 4f, swipeBottom - 4f)

        // 1. Ưu tiên tìm phím hợp lệ (kể cả Hàng số norm_0_ khi ở Base60)
        for ((id, rect) in keyRects) {
            val isEligibleKey = (isBase60 && id.startsWith("norm_0_")) ||
                    id.startsWith("norm_1_") || id.startsWith("norm_2_") ||
                    (id.startsWith("norm_3_") && id != "norm_3_0" && id != "norm_3_8")
            if (isEligibleKey && rect.contains(x, clampedY)) {
                return id
            }
        }

        // 2. Nếu nằm ở khoảng trống giữa các phím (padding), tìm phím hợp lệ gần nhất theo khoảng cách tâm
        var closestId: String? = null
        var minDist = Float.MAX_VALUE
        for ((id, rect) in keyRects) {
            val isEligibleKey = (isBase60 && id.startsWith("norm_0_")) ||
                    id.startsWith("norm_1_") || id.startsWith("norm_2_") ||
                    (id.startsWith("norm_3_") && id != "norm_3_0" && id != "norm_3_8")
            if (isEligibleKey) {
                val cx = rect.centerX()
                val cy = rect.centerY()
                val d = kotlin.math.hypot(x - cx, clampedY - cy)
                if (d < minDist) {
                    minDist = d
                    closestId = id
                }
            }
        }
        return closestId ?: findKeyAt(x, clampedY)
    }

    private fun drawSwipeTrail(canvas: Canvas) {
        if (swipePoints.size < 2) return

        val displayEpsilon = 12f * resources.displayMetrics.density
        val rawSimplified = SwipeGestureAnalyzer.simplifyPath(swipePoints, displayEpsilon)
        if (rawSimplified.size < 2) return

        // Snap các điểm neo (trừ điểm cuối là ngón tay hiện tại) về TÂM PHÍM (Key-Center Snapping)
        val snappedList = mutableListOf<Point>()
        for (i in rawSimplified.indices) {
            val pt = rawSimplified[i]
            if (i == rawSimplified.size - 1) {
                // Điểm cuối cùng: giữ nguyên vị trí ngón tay hiện tại để bám tay 0ms
                snappedList.add(pt)
            } else {
                val kId = findSwipeKeyAt(pt.x, pt.y)
                val rect = if (kId != null) keyRects[kId] else null
                if (rect != null) {
                    snappedList.add(Point(rect.centerX(), rect.centerY()))
                } else {
                    snappedList.add(pt)
                }
            }
        }

        // Loại bỏ các điểm trùng nhau liên tiếp
        val pts = mutableListOf<Point>()
        for (p in snappedList) {
            if (pts.isEmpty()) {
                pts.add(p)
            } else {
                val lastP = pts.last()
                if (kotlin.math.hypot(p.x - lastP.x, p.y - lastP.y) >= 4f) {
                    pts.add(p)
                }
            }
        }

        if (pts.size < 2) return

        val path = android.graphics.Path()
        if (pts.size == 2) {
            path.moveTo(pts[0].x, pts[0].y)
            path.lineTo(pts[1].x, pts[1].y)
        } else {
            // Midpoint Bézier qua các tâm phím → đường nối tuyệt đối phẳng, các góc rẽ bo cong mượt mà
            path.moveTo(pts[0].x, pts[0].y)
            path.lineTo((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2)
            for (i in 1 until pts.size - 1) {
                val midX = (pts[i].x + pts[i + 1].x) / 2
                val midY = (pts[i].y + pts[i + 1].y) / 2
                path.quadTo(pts[i].x, pts[i].y, midX, midY)
            }
            path.lineTo(pts.last().x, pts.last().y)
        }

        canvas.drawPath(path, swipeGlowPaint)
        canvas.drawPath(path, swipePathPaint)
    }

    private fun drawBkspTrail(canvas: Canvas) {
        if (!isBkspSliding || bkspPoints.size < 2) return
        val path = android.graphics.Path()
        path.moveTo(bkspPoints.first().x, bkspPoints.first().y)
        for (i in 1 until bkspPoints.size) {
            path.lineTo(bkspPoints[i].x, bkspPoints[i].y)
        }
        canvas.drawPath(path, bkspGlowPaint)
        canvas.drawPath(path, bkspTrailPaint)
    }

    private fun isBkspKey(id: String?): Boolean {
        if (id == null) return false
        return id == "norm_3_8" || id == "vowel_3_8" || id == "guide_3_8" || id == "key_bksp" ||
                keyModels[id]?.action is KeyboardAction.Backspace
    }

    private fun canStartSwipeTyping(id: String?): Boolean {
        if (id == null) return false
        val model = keyModels[id] ?: return false
        if (model.isSpecial) return false
        if (isBkspKey(id)) return false
        if (id == "space" || id.startsWith("norm_s_")) return false
        val isBase60 = (currentIOMode == IOMode.B60_TO_VN || currentIOMode == IOMode.B60_TO_B60)
        if (isBase60 && id.startsWith("norm_0_")) return true
        if (id.startsWith("norm_0_")) return false
        // Chỉ cho phép các phím chữ cái thực thụ: hàng 2 (QWERTY), hàng 3 (ASDF), hàng 4 (ZXCV trừ Shift và Backspace)
        return id.startsWith("norm_1_") || id.startsWith("norm_2_") ||
                (id.startsWith("norm_3_") && id != "norm_3_0" && id != "norm_3_8")
    }

    private fun findKeyAt(x: Float, y: Float): String? {
        for ((id, rect) in keyRects) {
            if (rect.contains(x, y)) return id
        }
        return null
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val x = event.x
        val y = event.y

        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                touchStartX = x
                touchStartY = y
                lastSpaceX = x
                isSpaceSliding = false
                didLongPress = false
                isFlicking = false
                currentFlickDir = -1
                isBkspSliding = false
                bkspWordsDeleted = 0
                bkspPoints.clear()
                isSwiping = false
                swipePoints.clear()

                val keyId = findKeyAt(x, y)
                pressedKeyId = keyId
                invalidate()
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)

                // Hẹn giờ giữ phím 250ms để kích hoạt Ma trận Tốc ký hoặc Menu chọn chế độ
                if (currentLayer == KeyboardLayer.NORMAL || currentLayer == KeyboardLayer.VOWEL_SELECTOR) {
                    if (keyId != null && (keyId.startsWith("norm_") || keyId.startsWith("vowel_"))) {
                        holdRunnable = Runnable {
                            didLongPress = true
                            openWordMacroMatrix(keyId)
                        }
                        holdHandler.postDelayed(holdRunnable!!, 250)
                    } else if (keyId == "space") {
                        holdRunnable = Runnable {
                            didLongPress = true
                            performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
                            if (onOpenIOModeMenu != null) {
                                onOpenIOModeMenu?.invoke()
                            } else {
                                val newMode = cycleIOMode()
                                android.widget.Toast.makeText(context, "Chế độ: ${newMode.displayName} [${newMode.badge}]", android.widget.Toast.LENGTH_SHORT).show()
                            }
                        }
                        holdHandler.postDelayed(holdRunnable!!, 250)
                    } else if (keyId == "search") {
                        holdRunnable = Runnable {
                            didLongPress = true
                            performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
                            toggleSearchLayer()
                        }
                        holdHandler.postDelayed(holdRunnable!!, 280)
                    }
                } else if (currentLayer == KeyboardLayer.GUIDE) {
                    if (keyId != null && keyId.startsWith("guide_") && !keyId.endsWith("_8") && !keyId.endsWith("_0")) {
                        holdRunnable = Runnable {
                            didLongPress = true
                            val model = keyModels[keyId]
                            val gChar = model?.guideInfo?.char
                            if (gChar != null) {
                                performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
                                onGuideKeyLongPressed?.invoke(gChar)
                            }
                        }
                        holdHandler.postDelayed(holdRunnable!!, 280)
                    }
                }
                return true
            }

            MotionEvent.ACTION_MOVE -> {
                val dx = x - touchStartX
                val dy = y - touchStartY
                val dist = kotlin.math.hypot(dx, dy)

                // Cải tiến 1: Trượt phím Space để di chuyển con trỏ (Space Cursor Slide)
                if (pressedKeyId == "space") {
                    val deltaSpaceX = x - lastSpaceX
                    val stepPx = 25f
                    if (kotlin.math.abs(deltaSpaceX) >= stepPx) {
                        if (deltaSpaceX > 0) {
                            onAction?.invoke(KeyboardAction.MoveRight)
                        } else {
                            onAction?.invoke(KeyboardAction.MoveLeft)
                        }
                        isSpaceSliding = true
                        lastSpaceX = x
                        cancelHoldTimer()
                        performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                    }
                    return true
                }

                // Cải tiến 2: Trượt Backspace xóa lũy tiến nhiều từ kèm vệt đỏ tua lùi
                if (isBkspKey(pressedKeyId)) {
                    if (dx <= -20f) {
                        val stepPx = 45f * resources.displayMetrics.density
                        val wordsTarget = ((-dx - 20f) / stepPx).toInt() + 1
                        if (wordsTarget > bkspWordsDeleted) {
                            val toDel = wordsTarget - bkspWordsDeleted
                            for (w in 0 until toDel) {
                                onAction?.invoke(KeyboardAction.DeleteWordBackward)
                                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            }
                            bkspWordsDeleted = wordsTarget
                            isBkspSliding = true
                            cancelHoldTimer()
                        }
                        if (isBkspSliding) {
                            if (bkspPoints.isEmpty()) {
                                val bRect = keyRects[pressedKeyId]
                                val startBkspX = bRect?.centerX() ?: touchStartX
                                val startBkspY = bRect?.centerY() ?: touchStartY
                                bkspPoints.add(Point(startBkspX, startBkspY))
                            }
                            bkspPoints.add(Point(x, y))
                        }
                        invalidate()
                    }
                    return true
                }

                // Hiệu ứng La bàn Flick Compass HUD nổi thời gian thực khi quệt
                // KÍCH HOẠT KHI Ở CHẾ ĐỘ NHẬP TIẾNG VIỆT (VN_TO_VN, VN_TO_B60)
                if (isCompassInputMode()) {
                    if (dist >= 18f && pressedKeyId != null) {
                        cancelHoldTimer()
                        val model = keyModels[pressedKeyId]
                        if (model?.chipDef != null) {
                            val engineDir = FlickCompassEngine.getDirectionFromDelta(dx, dy, 18f)
                            if (engineDir != null && (engineDir != currentFlickEngineDir || !isFlicking)) {
                                isFlicking = true
                                currentFlickEngineDir = engineDir
                                currentFlickDx = dx
                                currentFlickDy = dy
                                invalidate()
                            }
                        } else {
                            val newDir = getFlick6Direction(dx, dy)
                            if (newDir != currentFlickDir || !isFlicking) {
                                isFlicking = true
                                currentFlickDir = newDir
                                currentFlickDx = dx
                                currentFlickDy = dy
                                invalidate()
                            }
                        }
                    }
                } else {
                    // CÁC CHẾ ĐỘ KHÁC (B60_TO_VN, NO_ACCENT_TO_VN, B60_TO_B60):
                    // TẮT LA BÀN, BẬT CỬ CHỈ SWIPE ĐA PHÍM (CHỈ BẮT ĐẦU TỪ PHÍM CHỮ CÁI THỰC THỤ)!
                    if (dist >= 15f && canStartSwipeTyping(pressedKeyId)) {
                        cancelHoldTimer()
                        val totalRows = if ((currentLayer == KeyboardLayer.NORMAL || currentLayer == KeyboardLayer.SEARCH) && isRowSymbolsVisible) 6f else 5f
                        val rHeight = height / totalRows
                        val isBase60 = (currentIOMode == IOMode.B60_TO_VN || currentIOMode == IOMode.B60_TO_B60)
                        val swipeTop = if (isBase60) {
                            if (isRowSymbolsVisible) 1f * rHeight else 0f * rHeight
                        } else {
                            if (isRowSymbolsVisible) 2f * rHeight else 1f * rHeight
                        }
                        val swipeBottom = if (isRowSymbolsVisible) 5f * rHeight else 4f * rHeight

                        // Chỉ coi là động tác hất lên (flick up) nếu ngón tay thực sự vượt ra trên các hàng cho phép (y < swipeTop)
                        val isFlickingUp = (y < swipeTop) && (y < touchStartY - 25f * resources.displayMetrics.density) && (kotlin.math.abs(x - touchStartX) < kotlin.math.abs(y - touchStartY) * 1.5f)
                        val trackY = if (isFlickingUp) y else y.coerceIn(swipeTop + 4f, swipeBottom - 4f)

                        if (!isSwiping) {
                            isSwiping = true
                            swipePoints.clear()
                            val startTrackY = touchStartY.coerceIn(swipeTop + 4f, swipeBottom - 4f)
                            swipePoints.add(Point(touchStartX, startTrackY))
                        }
                        swipePoints.add(Point(x, trackY))

                        // Phân tích đường vuốt thời gian thực (Live Candidate Preview)
                        val now = SystemClock.uptimeMillis()
                        if (now - lastLiveAnalysisTime >= 35) {
                            lastLiveAnalysisTime = now
                            val epsilon = 18f * resources.displayMetrics.density
                            val density = resources.displayMetrics.density
                            val analysis = SwipeGestureAnalyzer.analyzeSwipeTrajectory(
                                swipePoints,
                                epsilon,
                                density,
                                isBase60,
                                swipeTop
                            ) { px, py ->
                                val kId = findSwipeKeyAt(px, py)
                                getKeyCharacter(kId)
                            }
                            val keyWidth = width / 10f
                            var detectedWord: String? = null
                            if (currentIOMode == IOMode.NO_ACCENT_TO_VN && letterKeyCenters.isNotEmpty()) {
                                val pointsForLexicon = if (analysis.isUpwardFlick && swipePoints.size >= 4) swipePoints.dropLast(2) else swipePoints
                                val lexiconMatches = VietnameseSwipeLexicon.matchSwipe(pointsForLexicon, letterKeyCenters, keyWidth)
                                if (lexiconMatches.isNotEmpty()) {
                                    detectedWord = lexiconMatches.joinToString("/")
                                }
                            }
                            if (detectedWord == null && analysis.keys.isNotEmpty()) {
                                detectedWord = analysis.keys.joinToString("")
                            }

                            if (!detectedWord.isNullOrEmpty()) {
                                if (detectedWord != lastLivePreviewWord) {
                                    lastLivePreviewWord = detectedWord
                                    onSwipeLivePreview?.invoke(detectedWord)
                                }
                            }
                            if (analysis.isUpwardFlick) {
                                swipePathPaint.color = Color.parseColor("#3FB950") // Xanh lá báo hiệu đang hất chọn
                                onHighlightSuggestion?.invoke(analysis.flickPickIndex)
                            } else {
                                swipePathPaint.color = Color.parseColor("#58A6FF")
                                onHighlightSuggestion?.invoke(-1)
                            }
                        }

                        invalidate()
                    }
                }

                return true
            }

            MotionEvent.ACTION_UP -> {
                cancelHoldTimer()
                val keyId = pressedKeyId
                pressedKeyId = null
                val dx = x - touchStartX
                val dy = y - touchStartY
                val dist = kotlin.math.hypot(dx, dy)

                // Nếu vừa trượt Space thì không nhập dấu cách
                if (keyId == "space" && isSpaceSliding) {
                    isSpaceSliding = false
                    invalidate()
                    return true
                }

                // Nếu vừa trượt Backspace đa từ thì kết thúc
                if (isBkspSliding) {
                    isBkspSliding = false
                    bkspWordsDeleted = 0
                    bkspPoints.clear()
                    invalidate()
                    return true
                }
                bkspPoints.clear()

                if (isCompassInputMode()) {
                    // Tắt HUD la bàn
                    isFlicking = false
                    val activeEngineDir = currentFlickEngineDir
                    currentFlickEngineDir = null
                    currentFlickDir = -1

                    // Quệt hướng 0ms độ trễ
                    if (dist >= 18f && keyId != null) {
                        val model = keyModels[keyId]
                        val gridKey = getGridKey(keyId) ?: model?.chipDef?.char
                        val tutorMatchedRhyme = if (gridKey != null) rhymeTutorHighlights[gridKey] else null

                        // 1. Ưu tiên hoàn tất từ bằng Rhyme Tutor
                        if (tutorMatchedRhyme != null && rhymeTutorPrefix.isNotEmpty()) {
                            val engineDir = activeEngineDir ?: FlickCompassEngine.getDirectionFromDelta(dx, dy, 18f)
                            val tone = when (engineDir) {
                                FlickDirection.SAC -> 1
                                FlickDirection.HUYEN -> 2
                                FlickDirection.HOI -> 3
                                FlickDirection.NGA -> 4
                                FlickDirection.NANG -> 5
                                FlickDirection.BANG -> 0
                                else -> 0
                            }
                            val tonedRhyme = RhymeTutorEngine.applyTone(tutorMatchedRhyme, tone)
                            val isCapitalized = rhymeTutorPrefix.firstOrNull()?.isUpperCase() == true
                            val finalRhyme = if (isCapitalized) tonedRhyme.replaceFirstChar { it.uppercase() } else tonedRhyme
                            performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            val pLen = rhymeTutorPrefix.length
                            clearRhymeTutor()
                            onAction?.invoke(KeyboardAction.CommitRhymeTutor(finalRhyme, pLen))
                            if (isShiftActive && !isCapsLock) {
                                isShiftActive = false
                                calculateKeys(width, height)
                            }
                            invalidate()
                            return true
                        }

                        val flickEngineDir = activeEngineDir ?: FlickCompassEngine.getDirectionFromDelta(dx, dy, 18f)
                        if (model?.chipDef != null && flickEngineDir != null) {
                            val value = FlickCompassEngine.getValueForDirection(
                                model.chipDef!!,
                                flickEngineDir,
                                isShiftActive || isCapsLock
                            )
                            if (value.isNotEmpty()) {
                                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                                // Phụ âm đầu (đ, tr, th, ch, ngh, ph...): Không thêm dấu cách để gõ tiếp vần!
                                // Vần hoặc từ hoàn chỉnh (o, ưu, được, hữu...): Thêm dấu cách để gõ từ sau liền mạch!
                                if (isInitialConsonant(value)) {
                                    onAction?.invoke(KeyboardAction.CommitText(value))
                                } else {
                                    onAction?.invoke(KeyboardAction.CommitRhymeTutor(value, 0))
                                }
                                if (isShiftActive && !isCapsLock) {
                                    isShiftActive = false
                                    calculateKeys(width, height)
                                }
                                invalidate()
                                return true
                            }
                        } else {
                            handleFlickAction(keyId, dx, dy)
                            invalidate()
                            return true
                        }
                    }
                } else {
                    // Xử lý hoàn tất vuốt từ (Swipe Trail) bằng thuật toán lọc đỉnh hình học
                    if (isSwiping) {
                        isSwiping = false
                        val epsilon = 18f * resources.displayMetrics.density
                        val density = resources.displayMetrics.density
                        val totalRows = if ((currentLayer == KeyboardLayer.NORMAL || currentLayer == KeyboardLayer.SEARCH) && isRowSymbolsVisible) 6f else 5f
                        val rHeight = height / totalRows
                        val isBase60 = (currentIOMode == IOMode.B60_TO_VN || currentIOMode == IOMode.B60_TO_B60)
                        val swipeTop = if (isBase60) {
                            if (isRowSymbolsVisible) 1f * rHeight else 0f * rHeight
                        } else {
                            if (isRowSymbolsVisible) 2f * rHeight else 1f * rHeight
                        }
                        val analysis = SwipeGestureAnalyzer.analyzeSwipeTrajectory(
                            swipePoints,
                            epsilon,
                            density,
                            isBase60,
                            swipeTop
                        ) { px, py ->
                            val kId = findSwipeKeyAt(px, py)
                            getKeyCharacter(kId)
                        }

                        val keyWidth = width / 10f
                        var swipedWord: String? = null
                        if (currentIOMode == IOMode.NO_ACCENT_TO_VN && letterKeyCenters.isNotEmpty()) {
                            val pointsForLexicon = if (analysis.isUpwardFlick && swipePoints.size >= 4) swipePoints.dropLast(2) else swipePoints
                            val lexiconMatches = VietnameseSwipeLexicon.matchSwipe(pointsForLexicon, letterKeyCenters, keyWidth)
                            if (lexiconMatches.isNotEmpty()) {
                                swipedWord = lexiconMatches.joinToString("/")
                            }
                        }
                        if (swipedWord == null && analysis.keys.isNotEmpty()) {
                            swipedWord = analysis.keys.joinToString("")
                        }

                        swipePoints.clear()
                        swipePathPaint.color = Color.parseColor("#58A6FF")
                        lastLivePreviewWord = ""
                        onHighlightSuggestion?.invoke(-1)
                        invalidate()

                        if (!swipedWord.isNullOrEmpty()) {
                            if (analysis.isUpwardFlick) {
                                // Người dùng bẻ góc hất lên trên: Chốt thẳng từ gợi ý trong 1 nét vuốt duy nhất!
                                onSwipeGesturePick?.invoke(swipedWord, analysis.flickPickIndex)
                            } else {
                                // Người dùng thả tay bình thường
                                onSwipeWord?.invoke(swipedWord)
                            }

                            // Tự động nhả Shift thường sau khi hoàn tất nét vuốt (chuẩn UX Gboard/iOS)
                            if (isShiftActive && !isCapsLock) {
                                isShiftActive = false
                                calculateKeys(width, height)
                                invalidate()
                            }
                            return true
                        }

                        if (isShiftActive && !isCapsLock) {
                            isShiftActive = false
                            calculateKeys(width, height)
                            invalidate()
                        }
                    }
                }

                // Chạm nhanh (Tap)
                if (!didLongPress && keyId != null) {
                    handleKeyTrigger(keyId)
                }

                invalidate()
                return true
            }

            MotionEvent.ACTION_CANCEL -> {
                cancelHoldTimer()
                pressedKeyId = null
                isSpaceSliding = false
                isBkspSliding = false
                bkspWordsDeleted = 0
                bkspPoints.clear()
                isFlicking = false
                currentFlickDir = -1
                currentFlickEngineDir = null
                isSwiping = false
                swipePoints.clear()
                swipePathPaint.color = Color.parseColor("#58A6FF")
                lastLivePreviewWord = ""
                onHighlightSuggestion?.invoke(-1)
                invalidate()
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    private fun handleKeyTrigger(keyId: String) {
        val model = keyModels[keyId] ?: return

        // 1. Xử lý Chế độ Soi vần (SEARCH mode)
        if (keyId == "search" || model.action is KeyboardAction.Search) {
            if (isNativeSearchContext) {
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                onAction?.invoke(KeyboardAction.Search)
            } else {
                toggleSearchLayer()
            }
            return
        }

        if (currentLayer == KeyboardLayer.SEARCH) {
            when {
                keyId == "search_close" || keyId == "enter" -> {
                    toggleSearchLayer()
                    return
                }
                keyId == "search_toggle_hidden" -> {
                    isSearchHiddenRhymesEnabled = !isSearchHiddenRhymesEnabled
                    calculateKeys(width, height)
                    invalidate()
                    return
                }
                keyId == "search_filter_2c" -> {
                    isFilter2c = !isFilter2c
                    calculateKeys(width, height)
                    invalidate()
                    return
                }
                keyId == "search_filter_3c" -> {
                    isFilter3c = !isFilter3c
                    calculateKeys(width, height)
                    invalidate()
                    return
                }
                keyId == "search_query_space" -> {
                    searchQuery = ""
                    calculateKeys(width, height)
                    invalidate()
                    return
                }
                keyId == "search_bksp" -> {
                    if (searchQuery.isNotEmpty()) {
                        searchQuery = searchQuery.dropLast(1)
                        calculateKeys(width, height)
                        invalidate()
                    }
                    return
                }
                keyId == "key_mode_toggle" -> {
                    toggleModeLayer()
                    return
                }
                keyId == "key_vowel_toggle" -> {
                    toggleVowelSelector()
                    return
                }
                keyId == "search_shift" -> {
                    isSearchMatchAnywhere = !isSearchMatchAnywhere
                    calculateKeys(width, height)
                    invalidate()
                    return
                }
                keyId.startsWith("search_") -> {
                    val target = model.subLabel ?: model.baseLabel
                    if (!target.isNullOrEmpty() && target.length == 1 && (target[0].isLetter() || target[0].isDigit())) {
                        searchQuery += target.lowercase()
                        calculateKeys(width, height)
                        invalidate()
                    }
                    return
                }
            }
            return // Chặn mọi hành động khác, không commit text khi đang ở SEARCH!
        }

        // 1. Phím chuyển tầng & điều hướng tầng
        when (keyId) {
            "key_mode_toggle" -> {
                toggleModeLayer()
                return
            }
            "key_row0_toggle" -> {
                toggleRowSymbols()
                return
            }
            "key_vowel_toggle" -> {
                toggleVowelSelector()
                return
            }
            "norm_3_0", "vowel_3_0", "guide_3_0", "key_shift_toggle", "key_vowel_shift_toggle" -> {
                if (currentLayer == KeyboardLayer.VOWEL_SELECTOR) {
                    toggleVowelShift()
                } else {
                    toggleShift()
                }
                return
            }
            "key_close_vowel", "key_close_guide" -> {
                setLayer(KeyboardLayer.NORMAL)
                return
            }
            "key_back_vowel" -> {
                backToVowelSelector()
                return
            }
            "key_close_macro" -> {
                closeWordMacroMatrix()
                return
            }
            "key_macro_settings" -> {
                val targetChar = activeMacroKey
                closeWordMacroMatrix()
                try {
                    val intent = Intent(context, MacroSettingsActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        putExtra("selected_char", targetChar)
                    }
                    context.startActivity(intent)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                return
            }
        }

        // 2. Chuyển sang Tầng Học Tập Guide khi bấm OpenGuideLayer (Mode ➔ g)
        if (model.action is KeyboardAction.OpenGuideLayer) {
            setLayer(KeyboardLayer.GUIDE)
            return
        }


        // 4. Nếu đang ở Ma trận Tốc ký (MACRO_PALETTE), bấm phím từ hoặc bất kỳ hành động nào -> gõ và đóng ma trận
        if (currentLayer == KeyboardLayer.MACRO_PALETTE) {
            onAction?.invoke(model.action)
            closeWordMacroMatrix()
            return
        }

        // 5. Nếu đang ở Tầng Học Tập (GUIDE), phát tín hiệu tap phím để cập nhật HUD thần chú
        // KHÔNG gọi onAction để tránh commit ký tự vào ô nhập liệu
        if (currentLayer == KeyboardLayer.GUIDE) {
            val gChar = model.guideInfo?.char
            if (gChar != null) {
                onGuideKeyTapped?.invoke(gChar)
            }
            return  // <-- Chặn commitText: Guide mode chỉ tra cứu, không xuất ký tự
        }

        // 6. Kích hoạt hành động chính
        onAction?.invoke(model.action)

        // 4. Nhả Shift sau 1 ký tự gõ phím ở tầng Normal (chuẩn Gboard nếu không phải CapsLock)
        if (currentLayer == KeyboardLayer.NORMAL && isShiftActive && !isCapsLock) {
            if (model.action is KeyboardAction.CommitText && model.action.text.isNotEmpty()) {
                isShiftActive = false
                calculateKeys(width, height)
                invalidate()
            }
        }

        // 5. Tự thoát tầng Mode sau khi chọn Mode hoặc Paste (nếu không Keep Mode)
        if (currentLayer == KeyboardLayer.MODE && !isKeepModeLayer && (model.action is KeyboardAction.SwitchMode || model.action is KeyboardAction.Paste)) {
            setLayer(KeyboardLayer.NORMAL)
        }

        // 6. Tự thoát tầng Vowel sau khi chọn ký tự (nếu không Keep Vowel)
        if (!isKeepVowelLayer && (currentLayer == KeyboardLayer.VOWEL_SELECTOR || currentLayer == KeyboardLayer.VOWEL_MATRIX)) {
            if (model.action is KeyboardAction.CommitText && model.action.text.isNotEmpty()) {
                setLayer(KeyboardLayer.NORMAL)
            }
        }
    }
}
