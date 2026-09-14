package vn.ehou.vsecretkeyboard

import android.inputmethodservice.InputMethodService
import android.view.LayoutInflater
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.LinearLayout
import android.widget.TextView

class VSecretKeyboardService : InputMethodService() {

    private lateinit var keyboardRoot: View
    private lateinit var swipeKeyboardView: SwipeKeyboardView
    private lateinit var btnMode: TextView
    private lateinit var btnNotes: TextView
    private lateinit var notesDrawer: LinearLayout

    private var currentMode = "TEXT" // TEXT, TIME, BASE60

    override fun onCreateInputView(): View {
        keyboardRoot = layoutInflater.inflate(R.layout.keyboard_layout, null)

        swipeKeyboardView = keyboardRoot.findViewById(R.id.swipe_keyboard_view)
        btnMode = keyboardRoot.findViewById(R.id.btn_mode)
        btnNotes = keyboardRoot.findViewById(R.id.btn_notes)
        notesDrawer = keyboardRoot.findViewById(R.id.notes_drawer)

        setupListeners()
        return keyboardRoot
    }

    private fun setupListeners() {
        btnMode.setOnClickListener {
            currentMode = when (currentMode) {
                "TEXT" -> "TIME"
                "TIME" -> "BASE60"
                else -> "TEXT"
            }
            btnMode.text = "$currentMode MODE"
        }

        btnNotes.setOnClickListener {
            if (notesDrawer.visibility == View.VISIBLE) {
                notesDrawer.visibility = View.GONE
                swipeKeyboardView.visibility = View.VISIBLE
            } else {
                notesDrawer.visibility = View.VISIBLE
                swipeKeyboardView.visibility = View.GONE
                loadNotes()
            }
        }

        swipeKeyboardView.onKeyClick = { key ->
            handleKeyClick(key)
        }

        swipeKeyboardView.onSwipeComplete = { points ->
            handleSwipe(points)
        }
    }

    private fun handleKeyClick(key: String) {
        val ic = currentInputConnection ?: return
        when (key) {
            "SPACE" -> ic.commitText(" ", 1)
            "ENTER" -> ic.commitText("\n", 1)
            "BKSP" -> ic.deleteSurroundingText(1, 0)
            "Mode" -> {
                // Same as clicking mode button on toolbar
                btnMode.performClick()
            }
            else -> {
                if (currentMode == "TEXT") {
                    ic.commitText(key, 1)
                } else {
                    // Logic to encode in place could go here
                    // For now just output the key
                    ic.commitText(key, 1)
                }
            }
        }
    }

    private fun handleSwipe(points: List<Point>) {
        val simplifiedPoints = SwipeGestureAnalyzer.simplifyPath(points, 25f)
        val geoKeys = mutableListOf<String>()
        
        for (pt in simplifiedPoints) {
            val key = swipeKeyboardView.getKeyFromPoint(pt.x, pt.y)
            val isSpecial = key == "SPACE" || key == "ENTER" || key == "BKSP" || key == "Mode" || key == "," || key == "."
            if (key != null && !isSpecial) {
                if (geoKeys.isEmpty() || geoKeys.last() != key) {
                    geoKeys.add(key)
                }
            }
        }

        val geoWord = geoKeys.joinToString("")
        if (geoWord.isNotEmpty()) {
            val ic = currentInputConnection ?: return
            
            // Suggestion Engine
            if (currentMode == "BASE60" || currentMode == "TIME") {
                // Encode the swiped word
                val encoded = VCompEngine.encodeWord(geoWord)
                if (currentMode == "BASE60") {
                    ic.commitText(VCompEngine.timeToBase60(encoded) + " ", 1)
                } else {
                    ic.commitText("$encoded ", 1)
                }
            } else {
                // If the user swipes something that looks like Base60, try to decode
                val isBase60 = geoWord.all { DataDictionary.BASE60_MAPPING.contains(it) }
                if (isBase60) {
                    val timeCode = VCompEngine.base60ToTime(geoWord)
                    val decoded = VCompEngine.decodeWord(timeCode)
                    if (!decoded.startsWith("[")) {
                        ic.commitText("$decoded ", 1)
                        return
                    }
                }
                
                // Fallback to raw swipe word
                ic.commitText("$geoWord ", 1)
            }
        }
    }

    private fun loadNotes() {
        // TODO: Load notes from SharedPreferences/Room into RecyclerView
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
    }
}
