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
        GUIDE
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
        val guideInfo: GuideInfo? = null
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

    private var lastShiftTapTime: Long = 0L
    private var lastVowelTapTime: Long = 0L
    private var lastModeTapTime: Long = 0L

    // Flick Compass HUD state:
    private var isFlicking: Boolean = false
    private var currentFlickDir: Int = -1
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

    var activeMacroKey: String = ""
        private set

    // Touch & Visual state
    private val keyRects = mutableMapOf<String, RectF>()
    private val keyModels = mutableMapOf<String, KeyModel>()
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

    // Constants
    private val shiftSymbolsRow1 = listOf("!", "@", "#", "$", "%", "^", "&", "*", "(", ")")

    init {
        isHapticFeedbackEnabled = true
    }

    fun setLayer(layer: KeyboardLayer) {
        currentLayer = layer
        if (layer != KeyboardLayer.NORMAL && layer != KeyboardLayer.GUIDE) {
            if (!isCapsLock) isShiftActive = false
        }
        if (layer != KeyboardLayer.VOWEL_SELECTOR) {
            isVowelSymbolShift = false
        }
        calculateKeys(width, height)
        invalidate()
        onLayerChanged?.invoke(currentLayer)
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

        val rowHeight = height / 5f
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
            KeyModel("search", "Search", "🔍", action = KeyboardAction.Search, bgHex = "#30363D", isSpecial = true),
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

        // Hàng 1: Số hoặc ký hiệu Shift (Nhãn phụ: 10 cụm diphthong, uâ & iê cạnh nhau)
        val r1Labels = if (isShiftActive) shiftSymbolsRow1 else listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "0")
        val r1Sublabels = listOf("ươ", "ưa", "uâ", "iê", "ia", "uô", "ua", "uê", "uy", "yê")
        for (i in r1Labels.indices) {
            val label = r1Labels[i]
            val sub = if (isShiftActive) "${(i + 1) % 10}" else r1Sublabels[i]
            val bg = if (isShiftActive) "#4A3718" else "#2D333B"
            val k = KeyModel("norm_0_$i", label, label, subLabel = sub, action = KeyboardAction.CommitText(label), bgHex = bg)
            keyRects[k.id] = RectF(i * w10 + padding, padding, (i + 1) * w10 - padding, rowHeight - padding)
            keyModels[k.id] = k
        }

        // Hàng 2: QWERTY (Nhãn phụ nguyên âm tiếng Việt)
        val rawR2 = listOf("q", "w", "e", "r", "t", "y", "u", "i", "o", "p")
        val r2Sub = listOf("oa", "ư", "e", "ê", "ơ", "y", "u", "i", "o", "ô")
        for (i in rawR2.indices) {
            val ch = if (isShiftActive) rawR2[i].uppercase() else rawR2[i]
            val k = KeyModel("norm_1_$i", ch, ch, subLabel = r2Sub[i], action = KeyboardAction.CommitText(ch))
            keyRects[k.id] = RectF(i * w10 + padding, rowHeight + padding, (i + 1) * w10 - padding, rowHeight * 2 - padding)
            keyModels[k.id] = k
        }

        // Hàng 3: ASDFGHJKL (s gán ă, d gán đ & phụ âm)
        val rawR3 = listOf("a", "s", "d", "f", "g", "h", "j", "k", "l")
        val r3Sub = listOf("a", "ă", "đ", "â", "au", "ai", "ay", "ao", "êu")
        val offset3 = w10 * 0.5f
        for (i in rawR3.indices) {
            val ch = if (isShiftActive || isCapsLock) rawR3[i].uppercase() else rawR3[i]
            val k = KeyModel("norm_2_$i", ch, ch, subLabel = r3Sub[i], action = KeyboardAction.CommitText(ch))
            val xStart = offset3 + (i * w10)
            keyRects[k.id] = RectF(xStart + padding, rowHeight * 2 + padding, xStart + w10 - padding, rowHeight * 3 - padding)
            keyModels[k.id] = k
        }

        // Hàng 4: [⇧ Shift / ⇪ Caps] + [ZXCVBNM] (z gán ngh) + [⌫ Backspace]
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
            id = "norm_3_0",
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

        val rawR4 = listOf("z", "x", "c", "v", "b", "n", "m")
        val r4Sub = listOf("ngh", "âu", "ơi", "ôi", "ui", "eo", "")
        for (i in rawR4.indices) {
            val ch = if (isShiftActive || isCapsLock) rawR4[i].uppercase() else rawR4[i]
            val k = KeyModel("norm_3_${i + 1}", ch, ch, subLabel = r4Sub[i], action = KeyboardAction.CommitText(ch))
            val xStart = shiftW + (i * midW)
            keyRects[k.id] = RectF(xStart + padding, y4 + padding, xStart + midW - padding, y4 + rowHeight - padding)
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
        keyRects[bkspModel.id] = RectF(width - bkspW + padding, y4 + padding, width - padding, y4 + rowHeight - padding)
        keyModels[bkspModel.id] = bkspModel

        // Hàng 5: [❖ Mode] [ớ] [,/?] [Space] [./"] [↵]
        calculateBottomRow(width, rowHeight, padding, isMode = false, isVowel = false)
    }

    // ========================================================
    // 2. TẦNG MODE CƠ SỐ 16 & BIÊN TẬP (0..e)
    // ========================================================
    private fun calculateModeKeys(width: Int, rowHeight: Float, padding: Float) {
        val w10 = width / 10f

        // Hàng 1: 10 Hex Mode (1..0)
        val r1Modes = listOf(
            KeyModel("mode_1", "1", "🟣", subLabel = "1", action = KeyboardAction.SwitchMode('1', "1: Base60", "🟣"), bgHex = "#6E40C9"),
            KeyModel("mode_2", "2", "🔤", subLabel = "2", action = KeyboardAction.SwitchMode('2', "2: Base60 liền", "🔤"), bgHex = "#1F6FEB"),
            KeyModel("mode_3", "3", "🟡", subLabel = "3", action = KeyboardAction.SwitchMode('3', "3: Giờ thiêng [4 số]", "🟡"), bgHex = "#D29922"),
            KeyModel("mode_4", "4", "✨", subLabel = "4", action = KeyboardAction.SwitchMode('4', "4: Kỳ quan", "✨"), bgHex = "#D29922"),
            KeyModel("mode_5", "5", "🔠", subLabel = "5", action = KeyboardAction.SwitchMode('5', "5: Cyber Font", "🔠"), bgHex = "#1F6FEB"),
            KeyModel("mode_6", "6", "🖊️", subLabel = "6", action = KeyboardAction.SwitchMode('6', "6: ViScript", "🖊️"), bgHex = "#238636"),
            KeyModel("mode_7", "7", "🔶", subLabel = "7", action = KeyboardAction.SwitchMode('7', "7: Unicode Zero", "🔶"), bgHex = "#BD561D"),
            KeyModel("mode_8", "8", "⏱️", subLabel = "8", action = KeyboardAction.SwitchMode('8', "8: Thời gian [6 số]", "⏱️"), bgHex = "#DA3633"),
            KeyModel("mode_9", "9", "🔢", subLabel = "9", action = KeyboardAction.SwitchMode('9', "9: Thời gian [5 số]", "🔢"), bgHex = "#8957E5"),
            KeyModel("mode_0", "0", "🟢", subLabel = "0", action = KeyboardAction.SwitchMode('0', "0: Tiếng Việt gốc", "🟢"), bgHex = "#238636")
        )
        for (i in r1Modes.indices) {
            val k = r1Modes[i]
            keyRects[k.id] = RectF(i * w10 + padding, padding, (i + 1) * w10 - padding, rowHeight - padding)
            keyModels[k.id] = k
        }

        // Hàng 2: Brackets, Mode e, Redo, Navigation, Paragraph
        val r2Keys = listOf(
            KeyModel("util_q", "q", "{}", subLabel = "q", action = KeyboardAction.WrapText("{", "}"), bgHex = "#1F6FEB"),
            KeyModel("util_w", "w", "\"\"", subLabel = "w", action = KeyboardAction.WrapText("\"", "\""), bgHex = "#1F6FEB"),
            KeyModel("mode_e", "e", "🌟", subLabel = "e", action = KeyboardAction.SwitchMode('e', "e: Giả Việt Tối giản", "🌟"), bgHex = "#DB61A2"),
            KeyModel("util_r", "r", "↷", subLabel = "r", action = KeyboardAction.Redo, bgHex = "#D29922"),
            KeyModel("util_t", "t", "()", subLabel = "t", action = KeyboardAction.WrapText("(", ")"), bgHex = "#1F6FEB"),
            KeyModel("util_y", "y", "[]", subLabel = "y", action = KeyboardAction.WrapText("[", "]"), bgHex = "#1F6FEB"),
            KeyModel("util_u", "u", "⇤", subLabel = "u", action = KeyboardAction.MoveHome, bgHex = "#238636"),
            KeyModel("util_i", "i", "▲", subLabel = "i", action = KeyboardAction.MoveUp, bgHex = "#238636"),
            KeyModel("util_o", "o", "⇥", subLabel = "o", action = KeyboardAction.MoveEnd, bgHex = "#238636"),
            KeyModel("util_p", "p", "¶", subLabel = "p", action = KeyboardAction.SelectParagraph, bgHex = "#388BFD")
        )
        for (i in r2Keys.indices) {
            val k = r2Keys[i]
            keyRects[k.id] = RectF(i * w10 + padding, rowHeight + padding, (i + 1) * w10 - padding, rowHeight * 2 - padding)
            keyModels[k.id] = k
        }

        // Hàng 3: Mode a, d; Sentence s; Case h; Navigation j, k, l
        val r3Keys = listOf(
            KeyModel("mode_a", "a", "⚡", subLabel = "a", action = KeyboardAction.SwitchMode('a', "a: CVNSS 4.0", "⚡"), bgHex = "#D29922"),
            KeyModel("util_s", "s", "🔤.", subLabel = "s", action = KeyboardAction.SelectToEndOfSentence, bgHex = "#388BFD"),
            KeyModel("mode_d", "d", "📝", subLabel = "d", action = KeyboardAction.SwitchMode('d', "d: Không dấu liền", "📝"), bgHex = "#238636"),
            KeyModel("util_f", "f", "…", subLabel = "f", action = KeyboardAction.CommitText(""), bgHex = "#30363D"),
            KeyModel("mode_guide", "g", "📖", subLabel = "g", action = KeyboardAction.OpenGuideLayer, bgHex = "#1F6FEB", textHex = "#FFFFFF"),
            KeyModel("util_h", "h", "🔠", subLabel = "h", action = KeyboardAction.ToggleCase, bgHex = "#1F6FEB"),
            KeyModel("util_j", "j", "◀", subLabel = "j", action = KeyboardAction.MoveLeft, bgHex = "#238636"),
            KeyModel("util_k", "k", "▼", subLabel = "k", action = KeyboardAction.MoveDown, bgHex = "#238636"),
            KeyModel("util_l", "l", "▶", subLabel = "l", action = KeyboardAction.MoveRight, bgHex = "#238636")
        )
        val offset3 = w10 * 0.5f
        for (i in r3Keys.indices) {
            val k = r3Keys[i]
            val xStart = offset3 + (i * w10)
            keyRects[k.id] = RectF(xStart + padding, rowHeight * 2 + padding, xStart + w10 - padding, rowHeight * 3 - padding)
            keyModels[k.id] = k
        }

        // Hàng 4: [⇧ Shift] + [z: Undo, x: Đầu văn bản, c: camelCase, v: Cuối văn bản, b: Mã Giả Việt, n: Clear, m: Xóa từ] + [⌦ Del]
        val shiftW = width * 0.14f
        val bkspW = width * 0.16f
        val midW = (width - shiftW - bkspW) / 7f
        val y4 = rowHeight * 3

        val shiftModel = KeyModel(
            id = "key_shift_toggle",
            baseLabel = "⇧",
            displayChar = "⇧",
            action = KeyboardAction.CommitText(""),
            bgHex = "#30363D",
            textHex = "#8B949E",
            isSpecial = true
        )
        keyRects[shiftModel.id] = RectF(padding, y4 + padding, shiftW - padding, y4 + rowHeight - padding)
        keyModels[shiftModel.id] = shiftModel

        val r4Keys = listOf(
            KeyModel("util_z", "z", "↶", subLabel = "z", action = KeyboardAction.Undo, bgHex = "#D29922"),
            KeyModel("util_x", "x", "⏮|", subLabel = "x", action = KeyboardAction.SelectToStart, bgHex = "#BD561D"),
            KeyModel("mode_c", "c", "🐫", subLabel = "c", action = KeyboardAction.SwitchMode('c', "c: camelCase", "🐫"), bgHex = "#D29922"),
            KeyModel("util_v", "v", "|⏭", subLabel = "v", action = KeyboardAction.SelectToEnd, bgHex = "#BD561D"),
            KeyModel("mode_b", "b", "✝️", subLabel = "b", action = KeyboardAction.SwitchMode('b', "b: Mã Giả Việt", "✝️"), bgHex = "#484F58"),
            KeyModel("util_n", "n", "🧹", subLabel = "n", action = KeyboardAction.ClearAll, bgHex = "#DA3633"),
            KeyModel("util_m", "m", "…", subLabel = "m", action = KeyboardAction.CommitText(""), bgHex = "#30363D")
        )
        for (i in r4Keys.indices) {
            val k = r4Keys[i]
            val xStart = shiftW + (i * midW)
            keyRects[k.id] = RectF(xStart + padding, y4 + padding, xStart + midW - padding, y4 + rowHeight - padding)
            keyModels[k.id] = k
        }

        val delModel = KeyModel(
            id = "key_bksp",
            baseLabel = "⌦",
            displayChar = "⌦",
            action = KeyboardAction.DeleteForward,
            bgHex = "#30363D",
            textHex = "#58A6FF",
            isSpecial = true
        )
        keyRects[delModel.id] = RectF(width - bkspW + padding, y4 + padding, width - padding, y4 + rowHeight - padding)
        keyModels[delModel.id] = delModel

        // Hàng 5: [❖ Mode] [ớ] [|🔤 Đầu câu] [Select All] [📋 Paste] [🔍] [↵]
        calculateBottomRow(width, rowHeight, padding, isMode = true, isVowel = false)
    }

    // ========================================================
    // 3. TẦNG TIẾNG VIỆT THÔNG MINH [ớ]
    // ========================================================
    private fun calculateVowelSelectorKeys(width: Int, rowHeight: Float, padding: Float) {
        val w10 = width / 10f

        // Hàng 1: 10 cụm nguyên âm kép (uâ & iê cạnh nhau)
        val r1Compounds = listOf("ươ", "ưa", "uâ", "iê", "ia", "uô", "ua", "uê", "uy", "yê")
        for (i in r1Compounds.indices) {
            val comp = r1Compounds[i]
            val k = KeyModel("vowel_0_$i", comp, comp, subLabel = "${(i + 1) % 10}", action = KeyboardAction.CommitText(comp), bgHex = "#0E6B65", textHex = "#FFFFFF")
            keyRects[k.id] = RectF(i * w10 + padding, padding, (i + 1) * w10 - padding, rowHeight - padding)
            keyModels[k.id] = k
        }

        // Hàng 2: oa, ư, e, ê, ơ, y, u, i, o, ô
        val r2Defs = listOf(
            "q" to "oa", "w" to "ư", "e" to "e", "r" to "ê", "t" to "ơ",
            "y" to "y", "u" to "u", "i" to "i", "o" to "o", "p" to "ô"
        )
        for (i in r2Defs.indices) {
            val (keyLetter, label) = r2Defs[i]
            val isMain = (label in listOf("e", "y", "u", "i", "o"))
            val bg = if (isMain) "#238636" else "#0E6B65"
            val k = KeyModel("vowel_1_$i", label, label, subLabel = keyLetter, action = KeyboardAction.CommitText(label), bgHex = bg, textHex = "#FFFFFF")
            keyRects[k.id] = RectF(i * w10 + padding, rowHeight + padding, (i + 1) * w10 - padding, rowHeight * 2 - padding)
            keyModels[k.id] = k
        }

        // Hàng 3: a, ă, đ, â, au, ai, ay, ao, êu
        val r3Defs = listOf(
            "a" to "a", "s" to "ă", "d" to "đ", "f" to "â", "g" to "au",
            "h" to "ai", "j" to "ay", "k" to "ao", "l" to "êu"
        )
        val offset3 = w10 * 0.5f
        for (i in r3Defs.indices) {
            val (keyLetter, label) = r3Defs[i]
            val bg = when (keyLetter) {
                "a" -> "#238636"
                "d" -> "#2EA043" // đ
                "s" -> "#1F6FEB" // ă
                else -> "#0E6B65"
            }
            val k = KeyModel("vowel_2_$i", label, label, subLabel = keyLetter, action = KeyboardAction.CommitText(label), bgHex = bg, textHex = "#FFFFFF")
            val xStart = offset3 + (i * w10)
            keyRects[k.id] = RectF(xStart + padding, rowHeight * 2 + padding, xStart + w10 - padding, rowHeight * 3 - padding)
            keyModels[k.id] = k
        }

        // Hàng 4: [⇧ Shift] + [ngh, âu, ơi, ôi, ui, eo, m] + [⌫]
        val shiftW = width * 0.14f
        val bkspW = width * 0.16f
        val midW = (width - shiftW - bkspW) / 7f
        val y4 = rowHeight * 3

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
        keyRects[shiftModel.id] = RectF(padding, y4 + padding, shiftW - padding, y4 + rowHeight - padding)
        keyModels[shiftModel.id] = shiftModel

        val r4Defs = listOf(
            "z" to "ngh", "x" to "âu", "c" to "ơi", "v" to "ôi", "b" to "ui", "n" to "eo", "m" to "m"
        )
        for (i in r4Defs.indices) {
            val (keyLetter, label) = r4Defs[i]
            val bg = when (label) {
                "ngh" -> "#BD561D"
                "m" -> "#30363D"
                else -> "#0E6B65"
            }
            val k = KeyModel("vowel_3_${i + 1}", label, label, subLabel = keyLetter, action = KeyboardAction.CommitText(label), bgHex = bg, textHex = "#FFFFFF")
            val xStart = shiftW + (i * midW)
            keyRects[k.id] = RectF(xStart + padding, y4 + padding, xStart + midW - padding, y4 + rowHeight - padding)
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
        keyRects[bkspModel.id] = RectF(width - bkspW + padding, y4 + padding, width - padding, y4 + rowHeight - padding)
        keyModels[bkspModel.id] = bkspModel

        // Hàng 5: [❖ Mode] [ớ (active)] [?] [Space] ["] [✕ Đóng]
        calculateBottomRow(width, rowHeight, padding, isMode = false, isVowel = true)
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
    private fun calculateBottomRow(width: Int, rowHeight: Float, padding: Float, isMode: Boolean, isVowel: Boolean) {
        val y5 = rowHeight * 4

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
            // Tầng [ớ]: [❖ Mode: 0.12] [ớ: 0.11] [? : 0.10] [Space: 0.31] [" : 0.10] [🔍: 0.12] [↵: 0.14] = 1.00
            val defs = listOf(
                KeyModel("key_mode_toggle", "❖", if (isKeepModeLayer) "❖ 🔒" else "❖", action = KeyboardAction.CommitText(""), bgHex = modeBg, textHex = modeText, isSpecial = true),
                KeyModel("key_vowel_toggle", "ớ", vowelLabel, action = KeyboardAction.CommitText(""), bgHex = vowelBg, textHex = vowelText, isSpecial = true, textSizeSp = if (isKeepVowelLayer) 14f else 18f),
                KeyModel("vowel_4_1", "?", "?", action = KeyboardAction.CommitText("?"), bgHex = "#1D3B2F", textHex = "#7EE787", textSizeSp = 18f),
                KeyModel("space", "Space", "Space", subLabel = currentIOMode.badge, action = KeyboardAction.CommitText(" "), bgHex = "#2D333B", textHex = "#E6EDF3", textSizeSp = 14f),
                KeyModel("vowel_4_3", "\"", "\"", action = KeyboardAction.WrapText("\"", "\""), bgHex = "#1D3B2F", textHex = "#7EE787", textSizeSp = 18f),
                KeyModel("search", "Search", "🔍", action = KeyboardAction.Search, bgHex = "#30363D", isSpecial = true),
                KeyModel("enter", "Enter", "↵", action = KeyboardAction.Enter, bgHex = "#238636", textHex = "#FFFFFF", isSpecial = true)
            )
            val weights = listOf(0.12f, 0.11f, 0.10f, 0.31f, 0.10f, 0.12f, 0.14f)
            var curX = 0f
            for (idx in defs.indices) {
                val k = defs[idx]
                val keyW = width * weights[idx]
                keyRects[k.id] = RectF(curX + padding, y5 + padding, curX + keyW - padding, y5 + rowHeight - padding)
                keyModels[k.id] = k
                curX += keyW
            }
        } else if (isMode) {
            // Tầng Mode: [❖ Mode: 0.12] [ớ: 0.11] [|🔤: 0.11] [Select All: 0.30] [📋: 0.11] [🔍: 0.11] [↵: 0.14] = 1.00
            val defs = listOf(
                KeyModel("key_mode_toggle", "❖", modeLabel, action = KeyboardAction.CommitText(""), bgHex = modeBg, textHex = modeText, isSpecial = true, textSizeSp = 12f),
                KeyModel("key_vowel_toggle", "ớ", vowelLabel, action = KeyboardAction.CommitText(""), bgHex = vowelBg, textHex = vowelText, isSpecial = true, textSizeSp = if (isKeepVowelLayer) 13f else 15f),
                KeyModel("mode_comma_sentence_start", "|🔤", "|🔤", subLabel = "Đầu câu", action = KeyboardAction.SelectToStartOfSentence, bgHex = "#BD561D", textHex = "#FFFFFF", textSizeSp = 13f),
                KeyModel("space", "Select All", "Select All", action = KeyboardAction.SelectAll, bgHex = "#1F6FEB", textHex = "#FFFFFF", isSpecial = true, textSizeSp = 13f),
                KeyModel("mode_dot_paste", "…", "…", subLabel = "…", action = KeyboardAction.CommitText(""), bgHex = "#30363D", textHex = "#8B949E", textSizeSp = 14f),
                KeyModel("search", "Search", "🔍", action = KeyboardAction.Search, bgHex = "#30363D", isSpecial = true),
                KeyModel("enter", "Enter", "↵", action = KeyboardAction.Enter, bgHex = "#238636", textHex = "#FFFFFF", isSpecial = true)
            )
            val weights = listOf(0.12f, 0.11f, 0.11f, 0.30f, 0.11f, 0.11f, 0.14f)
            var curX = 0f
            for (idx in defs.indices) {
                val k = defs[idx]
                val keyW = width * weights[idx]
                keyRects[k.id] = RectF(curX + padding, y5 + padding, curX + keyW - padding, y5 + rowHeight - padding)
                keyModels[k.id] = k
                curX += keyW
            }
        } else {
            // Tầng Normal: [❖ Mode: 0.12] [ớ: 0.11] [,/? : 0.10] [Space: 0.31] [./" : 0.10] [🔍: 0.12] [↵: 0.14] = 1.00
            val defs = listOf(
                KeyModel("key_mode_toggle", "❖", modeLabel, action = KeyboardAction.CommitText(""), bgHex = modeBg, textHex = modeText, isSpecial = true, textSizeSp = 12f),
                KeyModel("key_vowel_toggle", "ớ", vowelLabel, action = KeyboardAction.CommitText(""), bgHex = vowelBg, textHex = vowelText, isSpecial = true, textSizeSp = if (isKeepVowelLayer) 13f else 16f),
                KeyModel("norm_4_1", ",", ",", subLabel = "?", action = KeyboardAction.CommitText(","), textSizeSp = 18f),
                KeyModel("space", "Space", "Space", subLabel = currentIOMode.badge, action = KeyboardAction.CommitText(" "), bgHex = "#2D333B", textHex = "#E6EDF3", textSizeSp = 14f),
                KeyModel("norm_4_3", ".", ".", subLabel = "\"", action = KeyboardAction.CommitText("."), textSizeSp = 18f),
                KeyModel("search", "Search", "🔍", action = KeyboardAction.Search, bgHex = "#30363D", isSpecial = true),
                KeyModel("enter", "Enter", "↵", action = KeyboardAction.Enter, bgHex = "#238636", textHex = "#FFFFFF", isSpecial = true)
            )
            val weights = listOf(0.12f, 0.11f, 0.10f, 0.31f, 0.10f, 0.12f, 0.14f)
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
        val macros = FastMacroDatabase.getMacrosForKey(context, gridKey)
        if (macros.isNotEmpty()) {
            activeMacroKey = gridKey
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
        val flickChars = getFlickCharacters(keyId)
        if (flickChars.isEmpty()) return

        val density = resources.displayMetrics.scaledDensity
        val hudRadius = 66f * density
        val orbitRadius = 44f * density

        val hudX = rect.centerX().coerceIn(hudRadius + 8f, width - hudRadius - 8f)
        val aboveY = rect.top - hudRadius - 12f
        val hudY = if (aboveY - hudRadius < 6f) (rect.bottom + hudRadius + 12f).coerceAtMost(height - hudRadius - 6f) else aboveY

        // 1. Vòng tròn nền bán trong suốt Dark Theme
        canvas.drawCircle(hudX, hudY, hudRadius, hudBgPaint)
        canvas.drawCircle(hudX, hudY, hudRadius, hudBorderPaint)

        // 2. Tâm la bàn
        val gridKey = getGridKey(keyId) ?: keyId
        canvas.drawCircle(hudX, hudY, 13f * density, hudCenterPaint)
        hudTextPaint.color = Color.parseColor("#E6EDF3")
        hudTextPaint.textSize = 12f * density
        hudTextPaint.isFakeBoldText = true
        val cFm = hudTextPaint.fontMetrics
        val cY = hudY - (cFm.ascent + cFm.descent) / 2
        canvas.drawText(gridKey, hudX, cY, hudTextPaint)

        // 3. 6 Vị trí nan hoa (Clockwise / Compass directions)
        // 0: Up (⬆️, Sắc / tr), 1: Left (⬅️, Huyền / nh), 2: Right (➡️, Hỏi / kh),
        // 3: Down-Left (↙️, Ngã / gh), 4: Down (⬇️, Nặng / th), 5: Down-Right (↘️, Gốc / đ / ngh)
        val p0 = Pair(hudX, hudY - orbitRadius)
        val p1 = Pair(hudX - orbitRadius, hudY)
        val p2 = Pair(hudX + orbitRadius, hudY)
        val p3 = Pair(hudX - orbitRadius * 0.707f, hudY + orbitRadius * 0.707f)
        val p4 = Pair(hudX, hudY + orbitRadius)
        val p5 = Pair(hudX + orbitRadius * 0.707f, hudY + orbitRadius * 0.707f)
        val positions = listOf(p0, p1, p2, p3, p4, p5)

        // 4. Tia sáng kết nối từ tâm đến hướng đang được quệt
        if (currentFlickDir in 0..5) {
            val activePos = positions[currentFlickDir]
            canvas.drawLine(hudX, hudY, activePos.first, activePos.second, hudRayPaint)
        }

        // 5. Vẽ 6 nút ký tự
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

        for ((id, rect) in keyRects) {
            val model = keyModels[id] ?: continue
            val isPressed = (id == pressedKeyId)

            // Vẽ phím
            keyPaint.color = if (isPressed) Color.parseColor("#484F58") else Color.parseColor(model.bgHex)
            canvas.drawRoundRect(rect, 14f, 14f, keyPaint)
            keyBorderPaint.color = Color.parseColor("#373E47")
            canvas.drawRoundRect(rect, 14f, 14f, keyBorderPaint)

            val gInfo = model.guideInfo
            if (gInfo != null) {
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

    private fun drawSwipeTrail(canvas: Canvas) {
        if (swipePoints.size < 2) return
        val path = android.graphics.Path()
        path.moveTo(swipePoints[0].x, swipePoints[0].y)
        for (i in 1 until swipePoints.size) {
            val p0 = swipePoints[i - 1]
            val p1 = swipePoints[i]
            path.quadTo(p0.x, p0.y, (p0.x + p1.x) / 2, (p0.y + p1.y) / 2)
        }
        val last = swipePoints.last()
        path.lineTo(last.x, last.y)
        canvas.drawPath(path, swipeGlowPaint)
        canvas.drawPath(path, swipePathPaint)
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

                // Cải tiến 2: Trượt Backspace xóa lũy tiến nhiều từ
                if (pressedKeyId == "norm_3_8" || pressedKeyId == "vowel_3_8" || pressedKeyId == "key_bksp") {
                    if (dx <= -30f && kotlin.math.abs(dx) > kotlin.math.abs(dy)) {
                        val stepPx = 60f * resources.displayMetrics.density
                        val wordsTarget = ((-dx - 30f) / stepPx).toInt() + 1
                        if (wordsTarget > bkspWordsDeleted) {
                            val toDel = wordsTarget - bkspWordsDeleted
                            for (w in 0 until toDel) {
                                onAction?.invoke(KeyboardAction.DeleteWordBackward)
                                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                            }
                            bkspWordsDeleted = wordsTarget
                            isBkspSliding = true
                            cancelHoldTimer()
                            invalidate()
                        }
                        return true
                    }
                }

                // Hiệu ứng La bàn Flick Compass HUD nổi thời gian thực khi quệt
                // KÍCH HOẠT KHI Ở CHẾ ĐỘ NHẬP TIẾNG VIỆT (VN_TO_VN, VN_TO_B60)
                if (isCompassInputMode()) {
                    if (dist >= 18f && pressedKeyId != null) {
                        cancelHoldTimer()
                        val newDir = getFlick6Direction(dx, dy)
                        if (newDir != currentFlickDir || !isFlicking) {
                            isFlicking = true
                            currentFlickDir = newDir
                            currentFlickDx = dx
                            currentFlickDy = dy
                            invalidate()
                        }
                    }
                } else {
                    // CÁC CHẾ ĐỘ KHÁC (B60_TO_VN, NO_ACCENT_TO_VN, B60_TO_B60):
                    // TẮT LA BÀN, BẬT CỬ CHỈ SWIPE ĐA PHÍM!
                    if (dist >= 15f) {
                        cancelHoldTimer()
                        if (!isSwiping) {
                            isSwiping = true
                            swipePoints.clear()
                            swipePoints.add(Point(touchStartX, touchStartY))
                        }
                        swipePoints.add(Point(x, y))

                        // Phân tích đường vuốt thời gian thực (Live Candidate Preview)
                        val now = SystemClock.uptimeMillis()
                        if (now - lastLiveAnalysisTime >= 35) {
                            lastLiveAnalysisTime = now
                            val epsilon = 18f * resources.displayMetrics.density
                            val density = resources.displayMetrics.density
                            val isBase60 = (currentIOMode == IOMode.B60_TO_VN || currentIOMode == IOMode.B60_TO_B60)
                            val analysis = SwipeGestureAnalyzer.analyzeSwipeTrajectory(
                                swipePoints,
                                epsilon,
                                density,
                                isBase60
                            ) { px, py ->
                                val kId = findKeyAt(px, py)
                                getKeyCharacter(kId)
                            }
                            if (analysis.keys.isNotEmpty()) {
                                val currentWord = analysis.keys.joinToString("")
                                if (currentWord != lastLivePreviewWord) {
                                    lastLivePreviewWord = currentWord
                                    onSwipeLivePreview?.invoke(currentWord)
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
                    invalidate()
                    return true
                }

                if (isCompassInputMode()) {
                    // Tắt HUD la bàn
                    isFlicking = false
                    currentFlickDir = -1

                    // Quệt 6 hướng 0ms độ trễ
                    if (dist >= 18f && keyId != null) {
                        handleFlickAction(keyId, dx, dy)
                        invalidate()
                        return true
                    }
                } else {
                    // Xử lý hoàn tất vuốt từ (Swipe Trail) bằng thuật toán lọc đỉnh hình học
                    if (isSwiping) {
                        isSwiping = false
                        val epsilon = 18f * resources.displayMetrics.density
                        val density = resources.displayMetrics.density
                        val isBase60 = (currentIOMode == IOMode.B60_TO_VN || currentIOMode == IOMode.B60_TO_B60)
                        val analysis = SwipeGestureAnalyzer.analyzeSwipeTrajectory(
                            swipePoints,
                            epsilon,
                            density,
                            isBase60
                        ) { px, py ->
                            val kId = findKeyAt(px, py)
                            getKeyCharacter(kId)
                        }
                        swipePoints.clear()
                        swipePathPaint.color = Color.parseColor("#58A6FF")
                        lastLivePreviewWord = ""
                        onHighlightSuggestion?.invoke(-1)
                        invalidate()

                        if (analysis.keys.isNotEmpty()) {
                            val swipedWord = analysis.keys.joinToString("")
                            if (analysis.isUpwardFlick) {
                                // Người dùng bẻ góc hất lên trên: Chốt thẳng từ gợi ý trong 1 nét vuốt duy nhất!
                                onSwipeGesturePick?.invoke(swipedWord, analysis.flickPickIndex)
                            } else {
                                // Người dùng thả tay bình thường
                                onSwipeWord?.invoke(swipedWord)
                            }
                            return true
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
                isFlicking = false
                currentFlickDir = -1
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

        // 1. Phím chuyển tầng & điều hướng tầng
        when (keyId) {
            "key_mode_toggle" -> {
                toggleModeLayer()
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

        // 3. Chạm vào phím [d] trong tầng [ớ]: chạm nhẹ ra chữ đ
        if (currentLayer == KeyboardLayer.VOWEL_SELECTOR) {
            val gridKey = getGridKey(keyId)
            if (gridKey == "d") {
                val charD = if (isShiftActive || isCapsLock) "Đ" else "đ"
                onAction?.invoke(KeyboardAction.CommitText(charD))
                if (!isKeepVowelLayer) setLayer(KeyboardLayer.NORMAL)
                return
            }
        }

        // 4. Nếu đang ở Ma trận Tốc ký (MACRO_PALETTE), bấm phím từ hoặc bất kỳ hành động nào -> gõ và đóng ma trận
        if (currentLayer == KeyboardLayer.MACRO_PALETTE) {
            onAction?.invoke(model.action)
            closeWordMacroMatrix()
            return
        }

        // 5. Nếu đang ở Tầng Học Tập (GUIDE), phát tín hiệu tap phím để cập nhật HUD thần chú
        if (currentLayer == KeyboardLayer.GUIDE) {
            val gChar = model.guideInfo?.char
            if (gChar != null) {
                onGuideKeyTapped?.invoke(gChar)
            }
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
