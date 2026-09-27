package vn.ehou.vsecretkeyboard

import java.text.Normalizer
import kotlin.math.atan2

enum class FlickDirection(val code: String, val arrow: String, val angleDeg: Float, val label: String) {
    BANG("bang", "➡", 0f, "Bằng (3h)"),
    SC1("shortcut1", "↘", 45f, "sc1 (5h)"),      // Màn hình Y hướng xuống nên 45° dưới trục X = 4h30/5h
    NANG("nang", "⬇", 90f, "Nặng (6h)"),
    SC2("shortcut2", "↙", 135f, "sc2 (7h30)"),
    NGA("nga", "⬅", 180f, "Ngã (9h)"),
    HUYEN("huyen", "↖", 225f, "Huyền (10h30)"),
    SAC("sac", "⬆", 270f, "Sắc (12h)"),
    HOI("hoi", "↗", 315f, "Hỏi (1h30)")
}

object FlickCompassEngine {

    /**
     * Xác định hướng vuốt 8 hướng chuẩn toán học (tương thích 100% với Web getDirectionFromAngle)
     * @param dx Độ dịch chuyển trục X (pixel)
     * @param dy Độ dịch chuyển trục Y (pixel, Y hướng xuống)
     * @param thresholdPx Ngưỡng dịch chuyển tối thiểu (mặc định 18px)
     */
    fun getDirectionFromDelta(dx: Float, dy: Float, thresholdPx: Float = 18f): FlickDirection? {
        val dist = kotlin.math.hypot(dx, dy)
        if (dist < thresholdPx) return null
        val rad = atan2(dy.toDouble(), dx.toDouble())
        var deg = Math.toDegrees(rad).toFloat()
        var norm = (deg + 360f) % 360f
        val sector = (((norm + 22.5f) % 360f) / 45f).toInt()

        return when (sector) {
            0 -> FlickDirection.BANG    // 0: 3h (Bằng)
            1 -> FlickDirection.SC1     // 1: 5h (Shortcut 1)
            2 -> FlickDirection.NANG    // 2: 6h (Nặng)
            3 -> FlickDirection.SC2     // 3: 7h30 (Shortcut 2)
            4 -> FlickDirection.NGA     // 4: 9h (Ngã)
            5 -> FlickDirection.HUYEN   // 5: 10h30 (Huyền)
            6 -> FlickDirection.SAC     // 6: 12h (Sắc)
            7 -> FlickDirection.HOI     // 7: 1h30 (Hỏi)
            else -> FlickDirection.BANG
        }
    }

    private val MARKS = arrayOf("", "\u0301", "\u0300", "\u0309", "\u0303", "\u0323")
    private val VOWEL_PRIORITY = listOf("a", "ă", "â", "e", "ê", "o", "ô", "ơ", "y", "ư", "u", "i")

    /**
     * Gán dấu thanh điệu tiếng Việt chuẩn xác vào nguyên âm/vần
     * @param rhyme Vần không dấu (vd: "uô", "iê", "a", "ưu")
     * @param tone Mã dấu (0: ngang, 1: sắc, 2: huyền, 3: hỏi, 4: ngã, 5: nặng)
     */
    fun applyTone(rhyme: String, tone: Int): String {
        if (tone == 0 || rhyme.isEmpty() || tone !in 0..5) return rhyme
        val m = MARKS[tone]

        if (rhyme.startsWith("ưa")) {
            return Normalizer.normalize("ư$m" + rhyme.substring(1), Normalizer.Form.NFC)
        }
        if (rhyme.startsWith("ươ")) {
            return Normalizer.normalize("ươ$m" + rhyme.substring(2), Normalizer.Form.NFC)
        }
        if (rhyme.startsWith("uô")) {
            return Normalizer.normalize("uô$m" + rhyme.substring(2), Normalizer.Form.NFC)
        }
        if (rhyme.startsWith("iê")) {
            return Normalizer.normalize("iê$m" + rhyme.substring(2), Normalizer.Form.NFC)
        }

        for (v in VOWEL_PRIORITY) {
            val idx = rhyme.indexOf(v)
            if (idx != -1) {
                val combined = rhyme.substring(0, idx + 1) + m + rhyme.substring(idx + 1)
                return Normalizer.normalize(combined, Normalizer.Form.NFC)
            }
        }

        return Normalizer.normalize(rhyme + m, Normalizer.Form.NFC)
    }

    /**
     * Lấy giá trị chuỗi xuất ra theo hướng vuốt cho một phím vi mạch cụ thể
     */
    fun getValueForDirection(cfg: ChipKeyDef, dir: FlickDirection, isShifted: Boolean = false): String {
        // 1. Ưu tiên cấu hình đa vần directions nếu có (vd: phím r có ưu/ứu/ựu/ều/ếu/êu)
        if (cfg.directions != null) {
            val dVal = cfg.directions[dir.code]
            if (!dVal.isNullOrEmpty()) {
                return if (isShifted) dVal.replaceFirstChar { it.uppercase() } else dVal
            }
        }

        val rhyme = cfg.rhyme?.trim() ?: ""

        val rawResult = when (dir) {
            FlickDirection.SAC -> if (rhyme.isNotEmpty()) applyTone(rhyme, 1) else ""
            FlickDirection.HOI -> if (rhyme.isNotEmpty()) applyTone(rhyme, 3) else ""
            FlickDirection.BANG -> if (rhyme.isNotEmpty()) applyTone(rhyme, 0) else ""
            FlickDirection.SC1 -> cfg.sc1 ?: cfg.key
            FlickDirection.NANG -> if (rhyme.isNotEmpty()) applyTone(rhyme, 5) else ""
            FlickDirection.SC2 -> cfg.sc2 ?: ""
            FlickDirection.NGA -> if (rhyme.isNotEmpty()) applyTone(rhyme, 4) else ""
            FlickDirection.HUYEN -> if (rhyme.isNotEmpty()) applyTone(rhyme, 2) else ""
        }

        return if (isShifted && rawResult.isNotEmpty()) {
            rawResult.replaceFirstChar { it.uppercase() }
        } else {
            rawResult
        }
    }

    /**
     * Lấy bản đồ nhãn hiển thị cho 8 cánh hoa la bàn trên phím
     */
    fun getCompassLabels(cfg: ChipKeyDef, isShifted: Boolean = false): Map<FlickDirection, String> {
        val map = mutableMapOf<FlickDirection, String>()
        for (dir in FlickDirection.values()) {
            val v = getValueForDirection(cfg, dir, isShifted)
            if (v.isNotEmpty()) {
                map[dir] = v
            }
        }
        return map
    }
}
