package vn.ehou.vsecretkeyboard

import kotlin.math.hypot
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min

/**
 * Thuật toán nhận diện vệt vuốt hình thái (Lexicon-based Shape Writing Matcher)
 * Sử dụng Dynamic Time Warping (DTW) đối chiếu trực tiếp hình thái cử chỉ ngón tay
 * với đường vuốt lý tưởng của từ trong Từ điển tiếng Việt 7.190 từ.
 */
object VietnameseSwipeLexicon {

    private val wordsByStartChar = HashMap<Char, MutableList<String>>(30)
    @Volatile private var isIndexed = false

    private data class ScoredCandidate(
        val word: String,
        val score: Float
    )

    fun ensureIndexed() {
        if (isIndexed) return
        synchronized(this) {
            if (isIndexed) return
            val unaccentedKeys = DataDictionary.getUnaccentedKeys()
            for (w in unaccentedKeys) {
                if (w.isEmpty()) continue
                val start = w.first()
                wordsByStartChar.getOrPut(start) { mutableListOf() }.add(w)
            }
            isIndexed = true
        }
    }

    /**
     * Lấy mẫu lại đường vuốt thành N điểm có khoảng cách đều nhau (Resampling).
     */
    fun resamplePath(points: List<Point>, numPoints: Int = 25): List<Point> {
        if (points.size <= 1) return points
        if (numPoints <= 1) return listOf(points.first())

        var totalLength = 0f
        for (i in 1 until points.size) {
            totalLength += hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
        }

        if (totalLength <= 0f) {
            return List(numPoints) { points.first() }
        }

        val step = totalLength / (numPoints - 1)
        val resampled = mutableListOf<Point>()
        resampled.add(points.first())

        var accumulatedDist = 0f
        var currentSegmentStart = points.first()
        var ptIdx = 1

        while (ptIdx < points.size && resampled.size < numPoints - 1) {
            val nextPt = points[ptIdx]
            val segDist = hypot(nextPt.x - currentSegmentStart.x, nextPt.y - currentSegmentStart.y)

            if (accumulatedDist + segDist >= step) {
                val remain = step - accumulatedDist
                val t = if (segDist > 0f) remain / segDist else 0f
                val newX = currentSegmentStart.x + t * (nextPt.x - currentSegmentStart.x)
                val newY = currentSegmentStart.y + t * (nextPt.y - currentSegmentStart.y)
                val interpPt = Point(newX, newY)
                resampled.add(interpPt)
                currentSegmentStart = interpPt
                accumulatedDist = 0f
            } else {
                accumulatedDist += segDist
                currentSegmentStart = nextPt
                ptIdx++
            }
        }

        while (resampled.size < numPoints) {
            resampled.add(points.last())
        }

        return resampled
    }

    /**
     * Tìm các phím chữ cái gần một điểm chạm nhất trong bán kính maxRadius.
     */
    fun findNearbyKeys(pt: Point, keyCenters: Map<Char, Point>, maxRadius: Float): List<Char> {
        val candidates = mutableListOf<Pair<Char, Float>>()
        var closestChar: Char? = null
        var minD = Float.MAX_VALUE

        for ((ch, center) in keyCenters) {
            val d = hypot(pt.x - center.x, pt.y - center.y)
            if (d < minD) {
                minD = d
                closestChar = ch
            }
            if (d <= maxRadius) {
                candidates.add(Pair(ch, d))
            }
        }

        if (candidates.isEmpty() && closestChar != null) {
            return listOf(closestChar)
        }

        return candidates.sortedBy { it.second }.map { it.first }
    }

    /**
     * Tạo đường hình thái lý tưởng (Ideal Shape Polyline) của từ w và resample về N điểm
     */
    private fun getWordIdealPath(w: String, keyCenters: Map<Char, Point>, numPoints: Int = 25): List<Point>? {
        val vertices = mutableListOf<Point>()
        for (i in w.indices) {
            val p = keyCenters[w[i]] ?: return null
            vertices.add(p)
        }
        return resamplePath(vertices, numPoints)
    }

    /**
     * Dynamic Time Warping (DTW) với cửa sổ Sakoe-Chiba (window = 5).
     * Đo khoảng cách sai lệch hình thái chính xác giữa ngón tay và từ ứng viên.
     */
    private fun computeDtwScore(
        gesture: List<Point>,
        idealWordPath: List<Point>,
        window: Int = 5
    ): Float {
        val n = gesture.size
        val m = idealWordPath.size
        val dtw = Array(n + 1) { FloatArray(m + 1) { Float.MAX_VALUE } }
        dtw[0][0] = 0f

        for (i in 1..n) {
            val jStart = max(1, i - window)
            val jEnd = min(m, i + window)
            for (j in jStart..jEnd) {
                val cost = hypot(gesture[i - 1].x - idealWordPath[j - 1].x, gesture[i - 1].y - idealWordPath[j - 1].y)
                val minPrev = min(dtw[i - 1][j], min(dtw[i][j - 1], dtw[i - 1][j - 1]))
                if (minPrev != Float.MAX_VALUE) {
                    dtw[i][j] = cost + minPrev
                }
            }
        }
        return if (dtw[n][m] != Float.MAX_VALUE) dtw[n][m] / n else Float.MAX_VALUE
    }

    /**
     * Khớp đường vuốt với từ điển tiếng Việt:
     * Trả về danh sách các từ không dấu tốt nhất, sắp xếp theo độ khớp cao nhất.
     */
    fun matchSwipe(
        swipePoints: List<Point>,
        keyCenters: Map<Char, Point>,
        keyWidth: Float
    ): List<String> {
        if (swipePoints.size < 2) return emptyList()
        ensureIndexed()

        val pStart = swipePoints.first()
        val pEnd = swipePoints.last()

        val startCandidates = findNearbyKeys(pStart, keyCenters, keyWidth * 1.25f)
        val endCandidates = findNearbyKeys(pEnd, keyCenters, keyWidth * 1.25f)

        if (startCandidates.isEmpty() || endCandidates.isEmpty()) return emptyList()

        val gestureResampled = resamplePath(swipePoints, numPoints = 25)
        val scoredList = mutableListOf<ScoredCandidate>()

        for (sChar in startCandidates) {
            val sCenter = keyCenters[sChar] ?: continue
            val startDist = hypot(pStart.x - sCenter.x, pStart.y - sCenter.y)
            val wordList = wordsByStartChar[sChar] ?: continue

            for (w in wordList) {
                if (w.isEmpty()) continue
                val eChar = w.last()
                if (!endCandidates.contains(eChar)) continue
                val eCenter = keyCenters[eChar] ?: continue
                val endDist = hypot(pEnd.x - eCenter.x, pEnd.y - eCenter.y)

                val idealPath = getWordIdealPath(w, keyCenters, numPoints = 25) ?: continue

                // 1. Tính khoảng cách DTW hình thái thực giữa 2 đường
                val dtwDist = computeDtwScore(gestureResampled, idealPath, window = 5)
                if (dtwDist == Float.MAX_VALUE || dtwDist > keyWidth * 2.5f) continue

                // 2. Điểm phạt tần suất từ điển (từ càng phổ biến điểm càng ưu tiên)
                val topAccented = DataDictionary.getAccentedCandidates(w).firstOrNull() ?: w
                val rank = DataDictionary.getWordRank(topAccented)
                val freqPenalty = 0.04f * keyWidth * ln(rank.coerceAtLeast(1).toFloat() + 1f)

                // 3. Phạt khoảng cách neo chạm thực tế (Touch Anchor Penalty):
                // Phím nào xa điểm đặt ngón tay / nhấc ngón tay thực tế sẽ bị cộng phạt nặng
                val anchorPenalty = (startDist * 0.5f) + (endDist * 0.5f)

                // 4. Kiểm tra độ khớp phím trung gian (Intermediate Waypoint Verification):
                // Nếu từ có >= 3 ký tự (ví dụ: 'sao' có 'a'), kiểm tra xem vệt vuốt có thực sự ghé qua phím trung gian đó hay không.
                // Nếu ngón tay ghé sát phím trung gian (minDist <= 0.75f * keyWidth), cộng thưởng xác nhận điểm neo.
                // Nếu phím trung gian bị bỏ qua quá xa (minDist > 1.35f * keyWidth), cộng phạt.
                var intermediateAdjustment = 0f
                if (w.length >= 3) {
                    for (i in 1 until w.length - 1) {
                        val midCenter = keyCenters[w[i]] ?: continue
                        var minDist = Float.MAX_VALUE
                        for (pt in gestureResampled) {
                            val d = hypot(pt.x - midCenter.x, pt.y - midCenter.y)
                            if (d < minDist) minDist = d
                        }
                        if (minDist <= keyWidth * 0.75f) {
                            intermediateAdjustment -= 0.08f * keyWidth
                        } else if (minDist > keyWidth * 1.35f) {
                            intermediateAdjustment += 0.15f * keyWidth
                        }
                    }
                }

                val finalScore = dtwDist + freqPenalty + anchorPenalty + intermediateAdjustment
                scoredList.add(ScoredCandidate(w, finalScore))
            }
        }

        scoredList.sortBy { it.score }
        if (scoredList.isEmpty()) return emptyList()

        val bestScore = scoredList.first().score
        // Ngưỡng cạnh tranh tương đối (Relative Delta Window):
        // Mở rộng từ take(2) lên take(3) và nới nhẹ ngưỡng (0.35f * keyWidth)
        // để từ cạnh tranh sát nút (như biển vs hiện) không bị bỏ sót
        val competitiveThreshold = bestScore + (keyWidth * 0.35f)
        return scoredList.filter { it.score <= competitiveThreshold }.take(3).map { it.word }
    }
}
