package vn.ehou.vsecretkeyboard

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View

class SwipeKeyboardView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val LAYOUT = arrayOf(
        arrayOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "0"),
        arrayOf("q", "w", "e", "r", "t", "y", "u", "i", "o", "p"),
        arrayOf("a", "s", "d", "f", "g", "h", "j", "k", "l"),
        arrayOf("Mode", "z", "x", "c", "v", "b", "n", "m", ",", "."),
        arrayOf("SPACE", "ENTER", "BKSP")
    )

    private val keyRects = mutableMapOf<String, RectF>()
    private val keyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFFFFF")
        style = Paint.Style.FILL
    }
    private val keyBorderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#CCCCCC")
        style = Paint.Style.STROKE
        strokeWidth = 2f
    }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#000000")
        textSize = 45f
        textAlign = Paint.Align.CENTER
    }
    
    private val swipePathPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#4285F4") // Gboard blue
        style = Paint.Style.STROKE
        strokeWidth = 10f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    private val swipePoints = mutableListOf<Point>()
    private var isSwiping = false

    var onKeyClick: ((String) -> Unit)? = null
    var onSwipeComplete: ((List<Point>) -> Unit)? = null

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        calculateKeyRects(w, h)
    }

    private fun calculateKeyRects(width: Int, height: Int) {
        keyRects.clear()
        val rowHeight = height / LAYOUT.size.toFloat()
        val padding = 8f

        for (rowIndex in LAYOUT.indices) {
            val row = LAYOUT[rowIndex]
            val keyWidth = width / row.size.toFloat()
            val yOffset = rowIndex * rowHeight

            for (colIndex in row.indices) {
                val key = row[colIndex]
                
                // Adjust for bottom row special keys
                if (rowIndex == LAYOUT.size - 1) {
                    val specialWidth = width / 3f
                    val xOffset = colIndex * specialWidth
                    keyRects[key] = RectF(
                        xOffset + padding,
                        yOffset + padding,
                        xOffset + specialWidth - padding,
                        yOffset + rowHeight - padding
                    )
                } else {
                    val xOffset = colIndex * keyWidth
                    keyRects[key] = RectF(
                        xOffset + padding,
                        yOffset + padding,
                        xOffset + keyWidth - padding,
                        yOffset + rowHeight - padding
                    )
                }
            }
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        // Draw keys
        for ((key, rect) in keyRects) {
            canvas.drawRoundRect(rect, 12f, 12f, keyPaint)
            canvas.drawRoundRect(rect, 12f, 12f, keyBorderPaint)

            // Draw text centered
            val fontMetrics = textPaint.fontMetrics
            val x = rect.centerX()
            val y = rect.centerY() - (fontMetrics.ascent + fontMetrics.descent) / 2
            canvas.drawText(key, x, y, textPaint)
        }

        // Draw swipe path
        if (isSwiping && swipePoints.size > 1) {
            var prev = swipePoints.first()
            for (i in 1 until swipePoints.size) {
                val current = swipePoints[i]
                canvas.drawLine(prev.x, prev.y, current.x, current.y, swipePathPaint)
                prev = current
            }
        }
    }

    fun getKeyFromPoint(x: Float, y: Float): String? {
        for ((key, rect) in keyRects) {
            if (rect.contains(x, y)) {
                return key
            }
        }
        return null
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val x = event.x
        val y = event.y

        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                isSwiping = true
                swipePoints.clear()
                swipePoints.add(Point(x, y))
                invalidate()
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                if (isSwiping) {
                    swipePoints.add(Point(x, y))
                    invalidate()
                }
                return true
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                isSwiping = false
                if (swipePoints.size < 5) { // Very short swipe, consider it a click
                    val key = getKeyFromPoint(swipePoints.first().x, swipePoints.first().y)
                    if (key != null) {
                        onKeyClick?.invoke(key)
                    }
                } else {
                    onSwipeComplete?.invoke(swipePoints.toList())
                }
                swipePoints.clear()
                invalidate()
                return true
            }
        }
        return super.onTouchEvent(event)
    }
}
