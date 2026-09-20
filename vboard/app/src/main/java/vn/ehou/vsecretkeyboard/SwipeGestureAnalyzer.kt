package vn.ehou.vsecretkeyboard

import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min

data class Point(val x: Float, val y: Float)

data class SwipeAnalysisResult(
    val keys: List<String>,             // Các phím trích xuất (ví dụ: ["t", "w", "f"])
    val isUpwardFlick: Boolean = false, // true nếu đoạn cuối bẻ góc hất lên trên để chọn gợi ý
    val flickPickIndex: Int = 0         // 0: gợi ý số 1 (chính), 1: gợi ý số 2
)

object SwipeGestureAnalyzer {

    /**
     * Thuật toán Douglas-Peucker để đơn giản hóa đường vuốt (Swipe Trail)
     * Lọc bỏ các điểm nhiễu và giữ lại các đỉnh (corners) quan trọng.
     */
    fun simplifyPath(points: List<Point>, epsilon: Float): List<Point> {
        if (points.size <= 2) return points

        var maxDist = 0f
        var index = 0
        val start = points.first()
        val end = points.last()

        for (i in 1 until points.size - 1) {
            val pt = points[i]
            val dx = end.x - start.x
            val dy = end.y - start.y
            val mag2 = dx * dx + dy * dy

            var dist = 0f
            if (mag2 == 0f) {
                dist = hypot((pt.x - start.x).toDouble(), (pt.y - start.y).toDouble()).toFloat()
            } else {
                var t = ((pt.x - start.x) * dx + (pt.y - start.y) * dy) / mag2
                t = max(0f, min(1f, t))
                val closestX = start.x + t * dx
                val closestY = start.y + t * dy
                dist = hypot((pt.x - closestX).toDouble(), (pt.y - closestY).toDouble()).toFloat()
            }

            if (dist > maxDist) {
                maxDist = dist
                index = i
            }
        }

        if (maxDist > epsilon) {
            val left = simplifyPath(points.subList(0, index + 1), epsilon)
            val right = simplifyPath(points.subList(index, points.size), epsilon)
            // Ghép lại và bỏ điểm trùng lặp ở giữa
            return left.dropLast(1) + right
        } else {
            return listOf(start, end)
        }
    }

    /**
     * Phân tích đường vuốt trong thời gian thực:
     * - Trích xuất chuỗi phím chủ đích (C1, C2, C3).
     * - Nhận diện cú bẻ góc lần 2 hất lên trên (Upward Flick) để chốt từ gợi ý ngay lập tức.
     */
    fun analyzeSwipeTrajectory(
        rawPoints: List<Point>,
        epsilon: Float,
        dpDensity: Float,
        isBase60: Boolean = true,
        keyFinder: (Float, Float) -> String?
    ): SwipeAnalysisResult {
        if (rawPoints.isEmpty()) return SwipeAnalysisResult(emptyList())

        val startKey = keyFinder(rawPoints.first().x, rawPoints.first().y)
        if (rawPoints.size < 4) {
            val endKey = keyFinder(rawPoints.last().x, rawPoints.last().y)
            return SwipeAnalysisResult(listOfNotNull(startKey, endKey).distinct())
        }

        val simplified = simplifyPath(rawPoints, epsilon)
        val minFlickDy = -20f * dpDensity

        // 1. Kiểm tra xem đoạn đuôi cuối cùng có phải là cử chỉ bẻ góc hất lên trên để chọn từ gợi ý không
        if (simplified.size >= 4) {
            val pLast = simplified.last()
            val pPrev = simplified[simplified.size - 2]
            val dy = pLast.y - pPrev.y
            val dx = pLast.x - pPrev.x

            // Nếu đoạn cuối đi lên trên rõ rệt (dy âm lớn và góc dốc lên trên)
            if (dy < minFlickDy && abs(dx) < abs(dy) * 2.2f) {
                // Trích xuất các phím từ các đỉnh trước cú hất lên
                val pointsBeforeFlick = simplified.dropLast(1)
                val baseKeys = mutableListOf<String>()
                for (pt in pointsBeforeFlick) {
                    val k = keyFinder(pt.x, pt.y)
                    if (k != null && (baseKeys.isEmpty() || baseKeys.last() != k)) {
                        baseKeys.add(k)
                    }
                }
                if (startKey != null && (baseKeys.isEmpty() || baseKeys.first() != startKey)) {
                    baseKeys.add(0, startKey)
                }

                val flickPickIndex = if (dx > 25f * dpDensity) 1 else 0
                val finalKeys = if (isBase60) baseKeys.take(3) else baseKeys
                return SwipeAnalysisResult(
                    keys = finalKeys,
                    isUpwardFlick = true,
                    flickPickIndex = flickPickIndex
                )
            }
        }

        // 2. Không có cú hất lên: Trích xuất các phím bình thường
        val candidateKeys = mutableListOf<String>()
        for (pt in simplified) {
            val k = keyFinder(pt.x, pt.y)
            if (k != null && (candidateKeys.isEmpty() || candidateKeys.last() != k)) {
                candidateKeys.add(k)
            }
        }

        val endKey = keyFinder(rawPoints.last().x, rawPoints.last().y)
        if (startKey != null && (candidateKeys.isEmpty() || candidateKeys.first() != startKey)) {
            candidateKeys.add(0, startKey)
        }
        if (endKey != null && (candidateKeys.isEmpty() || candidateKeys.last() != endKey)) {
            candidateKeys.add(endKey)
        }

        // Nếu chuỗi > 3 ký tự và đang ở chế độ Base60 (do lướt võng qua các phím thẳng hàng), tìm đỉnh góc rẽ rõ nhất
        if (isBase60 && candidateKeys.size > 3 && startKey != null && endKey != null) {
            val pStart = rawPoints.first()
            val pEnd = rawPoints.last()
            val dx = pEnd.x - pStart.x
            val dy = pEnd.y - pStart.y
            val mag2 = dx * dx + dy * dy

            var maxCornerDist = 0f
            var bestCornerPt: Point? = null

            for (i in 1 until rawPoints.size - 1) {
                val pt = rawPoints[i]
                val dist = if (mag2 == 0f) {
                    hypot((pt.x - pStart.x).toDouble(), (pt.y - pStart.y).toDouble()).toFloat()
                } else {
                    var t = ((pt.x - pStart.x) * dx + (pt.y - pStart.y) * dy) / mag2
                    t = max(0f, min(1f, t))
                    val cx = pStart.x + t * dx
                    val cy = pStart.y + t * dy
                    hypot((pt.x - cx).toDouble(), (pt.y - cy).toDouble()).toFloat()
                }

                if (dist > maxCornerDist) {
                    maxCornerDist = dist
                    bestCornerPt = pt
                }
            }

            if (bestCornerPt != null && maxCornerDist > epsilon) {
                val cornerKey = keyFinder(bestCornerPt.x, bestCornerPt.y)
                if (cornerKey != null && cornerKey != startKey && cornerKey != endKey) {
                    return SwipeAnalysisResult(listOf(startKey, cornerKey, endKey))
                }
            }
            return SwipeAnalysisResult(candidateKeys.take(3))
        }

        return SwipeAnalysisResult(candidateKeys)
    }

    /**
     * Tương thích ngược: Trích xuất danh sách phím từ Swipe Trail
     */
    fun extractIntendedKeys(
        rawPoints: List<Point>,
        epsilon: Float,
        keyFinder: (Float, Float) -> String?
    ): List<String> {
        return analyzeSwipeTrajectory(rawPoints, epsilon, 2.5f, isBase60 = true, keyFinder = keyFinder).keys
    }
}
