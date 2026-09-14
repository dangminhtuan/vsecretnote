package vn.ehou.vsecretkeyboard

import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min

data class Point(val x: Float, val y: Float)

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
}
