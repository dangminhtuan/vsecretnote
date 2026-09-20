package vn.ehou.vsecretkeyboard

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/**
 * Quản lý học thói quen và tần suất cá nhân của người dùng cho bàn phím vBoard.
 * Tự động ghi nhận số lần chọn từ và lưu trữ bền vững vào SharedPreferences.
 */
object UserHabitManager {
    private const val PREFS_NAME = "vboard_user_habits"
    private const val KEY_PAIR_COUNTS = "pair_counts_json"
    private const val KEY_WORD_COUNTS = "word_counts_json"

    private var prefs: SharedPreferences? = null
    private val pairCounts = ConcurrentHashMap<String, Int>()
    private val wordTotalCounts = ConcurrentHashMap<String, Int>()
    @Volatile private var isInitialized = false

    fun init(context: Context) {
        if (isInitialized) return
        val appContext = context.applicationContext
        prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        try {
            val pairJsonStr = prefs?.getString(KEY_PAIR_COUNTS, "{}") ?: "{}"
            val pairJson = JSONObject(pairJsonStr)
            val pairKeys = pairJson.keys()
            while (pairKeys.hasNext()) {
                val k = pairKeys.next()
                pairCounts[k] = pairJson.optInt(k, 0)
            }

            val wordJsonStr = prefs?.getString(KEY_WORD_COUNTS, "{}") ?: "{}"
            val wordJson = JSONObject(wordJsonStr)
            val wordKeys = wordJson.keys()
            while (wordKeys.hasNext()) {
                val k = wordKeys.next()
                wordTotalCounts[k] = wordJson.optInt(k, 0)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        isInitialized = true
    }

    /**
     * Ghi nhận người dùng đã chọn một từ cụ thể cho mã nhập.
     * @param code Mã gốc (ví dụ: "ctz", "khong")
     * @param word Từ tiếng Việt được chọn (ví dụ: "công", "không")
     */
    fun recordSelection(code: String, word: String) {
        if (code.isBlank() || word.isBlank()) return
        val cleanCode = code.trim().lowercase()
        val pairKey = "$cleanCode:$word"

        val currentPair = (pairCounts[pairKey] ?: 0) + 1
        pairCounts[pairKey] = currentPair

        val currentWord = (wordTotalCounts[word] ?: 0) + 1
        wordTotalCounts[word] = currentWord

        // Lưu bền vững bất đồng bộ
        savePreferencesAsync()
    }

    private fun savePreferencesAsync() {
        val p = prefs ?: return
        try {
            val pairJson = JSONObject()
            for ((k, v) in pairCounts) {
                pairJson.put(k, v)
            }

            val wordJson = JSONObject()
            for ((k, v) in wordTotalCounts) {
                wordJson.put(k, v)
            }

            p.edit()
                .putString(KEY_PAIR_COUNTS, pairJson.toString())
                .putString(KEY_WORD_COUNTS, wordJson.toString())
                .apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Tính điểm trọng số ưu tiên:
     * - Ưu tiên 1: Tần suất người dùng đã từng chọn từ này cho mã tương ứng (mỗi lần +1 tỷ điểm).
     * - Ưu tiên 2: Tần suất người dùng sử dụng từ này nói chung (mỗi lần +1 triệu điểm).
     * - Ưu tiên 3: Thứ hạng từ điển quốc gia (rank nhỏ hơn = phổ biến hơn = điểm cao hơn).
     */
    fun calculateScore(code: String, word: String, dictRank: Int): Long {
        val cleanCode = code.trim().lowercase()
        val pairKey = "$cleanCode:$word"

        val pairCount = pairCounts[pairKey] ?: 0
        val wordCount = wordTotalCounts[word] ?: 0

        val normalizedRankBonus = (100_000L - dictRank.coerceIn(0, 100_000).toLong())
        return (pairCount.toLong() * 1_000_000_000L) +
               (wordCount.toLong() * 1_000_000L) +
               normalizedRankBonus
    }
}
