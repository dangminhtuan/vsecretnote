package vn.ehou.vsecretkeyboard

import android.content.Context
import android.content.SharedPreferences
import android.content.res.AssetManager

/**
 * NextWordPredictor — Dự đoán từ tiếp theo dựa trên từ vừa gõ xong.
 *
 * Nguồn dữ liệu (theo thứ tự ưu tiên):
 * 1. Thói quen cá nhân (SharedPreferences "vboard_bigrams") — học realtime
 * 2. Corpus bigram từ file assets/vn_bigrams.txt (Wikipedia VI)
 *
 * Format file vn_bigrams.txt: "từA\ttừB\ttần_suất" mỗi dòng
 */
object NextWordPredictor {

    private const val PREFS_NAME = "vboard_bigrams"
    private const val KEY_PREFIX = "bg_"
    private const val MAX_PERSONAL_BOOST = 200

    // Cache bigram từ file assets (nạp 1 lần lúc khởi động)
    // Map: w1 -> List<Pair<w2, count>>  đã được sắp xếp theo count giảm dần
    private val corpusBigrams = HashMap<String, MutableList<Pair<String, Int>>>()

    // Personal bigrams từ SharedPreferences (realtime)
    private var prefs: SharedPreferences? = null

    // Đã nạp corpus chưa
    private var initialized = false

    /** Gọi trong onCreate() của IME, hoặc lần đầu truy cập */
    fun init(context: Context, assets: AssetManager) {
        if (initialized) return
        initialized = true
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        loadCorpus(assets)
    }

    /** Nạp file vn_bigrams.txt từ assets */
    private fun loadCorpus(assets: AssetManager) {
        try {
            assets.open("vn_bigrams.txt").bufferedReader(Charsets.UTF_8).use { reader ->
                reader.forEachLine { line ->
                    val parts = line.trim().split("\t")
                    if (parts.size >= 2) {
                        val w1 = parts[0].trim().lowercase()
                        val w2 = parts[1].trim().lowercase()
                        val cnt = parts.getOrNull(2)?.trim()?.toIntOrNull() ?: 1
                        if (w1.isNotEmpty() && w2.isNotEmpty()) {
                            corpusBigrams.getOrPut(w1) { mutableListOf() }.add(Pair(w2, cnt))
                        }
                    }
                }
            }
            // Sort mỗi list theo count giảm dần
            corpusBigrams.values.forEach { list -> list.sortByDescending { it.second } }
        } catch (e: Exception) {
            // File chưa có hoặc lỗi đọc — không crash, chỉ dùng personal bigrams
        }
    }

    /**
     * Lấy top N từ gợi ý tiếp theo sau [prevWord].
     *
     * Trộn: personal habits (điểm cao hơn) + corpus bigrams
     * Trả về list rỗng nếu không có gợi ý.
     */
    fun getSuggestions(prevWord: String, limit: Int = 4): List<String> {
        if (!initialized) return emptyList()
        val prev = prevWord.trim().lowercase()
        if (prev.isEmpty() || prev.length < 2) return emptyList()

        // Gom điểm: word -> score
        val scoreMap = HashMap<String, Float>()

        // 1. Corpus bigrams (điểm cơ bản theo log-count)
        corpusBigrams[prev]?.forEach { (w2, cnt) ->
            val base = Math.log(cnt.toDouble() + 1).toFloat() * 10f
            scoreMap[w2] = (scoreMap[w2] ?: 0f) + base
        }

        // 2. Personal habits (điểm cộng thêm, ưu tiên cao hơn)
        val personalKey = "$KEY_PREFIX${prev}_"
        prefs?.all?.forEach { (key, value) ->
            if (key.startsWith(personalKey)) {
                val nextWord = key.removePrefix(personalKey)
                if (nextWord.isNotEmpty()) {
                    val personalCount = (value as? Int) ?: 0
                    // Personal boost: tối đa 200 điểm khi count = MAX_PERSONAL_BOOST
                    val personalScore = minOf(personalCount.toFloat() * 15f, MAX_PERSONAL_BOOST.toFloat())
                    scoreMap[nextWord] = (scoreMap[nextWord] ?: 0f) + personalScore
                }
            }
        }

        if (scoreMap.isEmpty()) return emptyList()

        return scoreMap.entries
            .sortedByDescending { it.value }
            .take(limit)
            .map { it.key }
    }

    /**
     * Ghi nhận bigram cá nhân: người dùng đã gõ [nextWord] ngay sau [prevWord].
     * Gọi khi: user chọn next-word chip, hoặc commit xong 1 từ thủ công.
     */
    fun recordBigram(prevWord: String, nextWord: String) {
        val prefs = prefs ?: return
        val prev = prevWord.trim().lowercase()
        val next = nextWord.trim().lowercase()
        if (prev.isEmpty() || next.isEmpty() || prev == next) return
        if (prev.length < 2 || next.length < 2) return

        val key = "$KEY_PREFIX${prev}_${next}"
        val current = prefs.getInt(key, 0)
        prefs.edit().putInt(key, minOf(current + 1, 9999)).apply()
    }

    /**
     * Kiểm tra xem có gợi ý nào cho từ [prevWord] không (quick check không tốn CPU).
     */
    fun hasSuggestions(prevWord: String): Boolean {
        val prev = prevWord.trim().lowercase()
        if (prev.length < 2) return false
        if (corpusBigrams.containsKey(prev)) return true
        val personalKey = "$KEY_PREFIX${prev}_"
        return prefs?.all?.keys?.any { it.startsWith(personalKey) } == true
    }
}
