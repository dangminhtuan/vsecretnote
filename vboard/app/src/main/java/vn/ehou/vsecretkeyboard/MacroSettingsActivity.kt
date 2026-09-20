package vn.ehou.vsecretkeyboard

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.HorizontalScrollView
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class MacroSettingsActivity : AppCompatActivity() {

    private val alphabet = ('a'..'z').map { it.toString() }
    private var currentLetter = "h"

    private lateinit var scrollLetters: HorizontalScrollView
    private lateinit var containerLetters: LinearLayout
    private lateinit var tvSectionTitle: TextView
    private lateinit var etNewPhrase: EditText
    private lateinit var tvPreviewBadge: TextView
    private lateinit var tvPreviewLevel: TextView
    private lateinit var btnAddMacro: Button
    private lateinit var tvListCount: TextView
    private lateinit var containerMacroItems: LinearLayout
    private lateinit var btnResetLetter: Button
    private lateinit var btnBack: ImageButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_macro_settings)

        val passedChar = intent.getStringExtra("selected_char")?.lowercase()
        if (!passedChar.isNullOrEmpty() && alphabet.contains(passedChar)) {
            currentLetter = passedChar
        }

        initViews()
        setupAlphabetBar()
        setupInputListener()
        setupActionButtons()
        loadMacroList()
    }

    private fun initViews() {
        scrollLetters = findViewById(R.id.scroll_letters)
        containerLetters = findViewById(R.id.container_letters)
        tvSectionTitle = findViewById(R.id.tv_section_title)
        etNewPhrase = findViewById(R.id.et_new_phrase)
        tvPreviewBadge = findViewById(R.id.tv_preview_badge)
        tvPreviewLevel = findViewById(R.id.tv_preview_level)
        btnAddMacro = findViewById(R.id.btn_add_macro)
        tvListCount = findViewById(R.id.tv_list_count)
        containerMacroItems = findViewById(R.id.container_macro_items)
        btnResetLetter = findViewById(R.id.btn_reset_letter)
        btnBack = findViewById(R.id.btn_back)
    }

    private fun setupAlphabetBar() {
        containerLetters.removeAllViews()
        val density = resources.displayMetrics.density

        for (letter in alphabet) {
            val btn = Button(this).apply {
                text = letter.uppercase()
                textSize = 14f
                val isSelected = (letter == currentLetter)
                setTextColor(if (isSelected) Color.WHITE else Color.parseColor("#8B949E"))
                val bg = GradientDrawable().apply {
                    cornerRadius = 8f * density
                    setColor(if (isSelected) Color.parseColor("#1F6FEB") else Color.parseColor("#21262D"))
                }
                background = bg
                minWidth = (40 * density).toInt()
                height = (40 * density).toInt()
                val params = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    (40 * density).toInt()
                ).apply {
                    marginEnd = (6 * density).toInt()
                }
                layoutParams = params

                setOnClickListener {
                    currentLetter = letter
                    setupAlphabetBar()
                    loadMacroList()
                    updatePreview(etNewPhrase.text.toString())
                }
            }
            containerLetters.addView(btn)
        }

        // Tự động cuộn đến chữ cái đang chọn
        containerLetters.post {
            val idx = alphabet.indexOf(currentLetter)
            if (idx >= 0) {
                val btnW = (46 * density).toInt()
                scrollLetters.smoothScrollTo(idx * btnW - (100 * density).toInt(), 0)
            }
        }
    }

    private fun setupInputListener() {
        etNewPhrase.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                updatePreview(s?.toString() ?: "")
            }
            override fun afterTextChanged(s: Editable?) {}
        })
        updatePreview("")
    }

    private fun updatePreview(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) {
            tvPreviewBadge.text = "[--]"
            tvPreviewBadge.setBackgroundColor(Color.parseColor("#163326"))
            tvPreviewBadge.setTextColor(Color.parseColor("#7EE787"))
            tvPreviewLevel.text = "Cấp 1 (Gõ để xem trước)"
            return
        }

        val targetChar = currentLetter[0]
        val (label, level) = FastMacroDatabase.generateSmartLabel(trimmed, targetChar)
        tvPreviewBadge.text = label

        val (bg, textColor, levelName) = when (level) {
            4 -> Triple("#441C22", "#FF7B72", "Cấp 4: Cụm ≥ 5 từ")
            3 -> Triple("#3E2612", "#FFA657", "Cấp 3: Viết tắt 3-4 từ")
            2 -> Triple("#162C46", "#79C0FF", "Cấp 2: Từ ghép 2 từ")
            else -> Triple("#163326", "#7EE787", "Cấp 1: Từ đơn")
        }

        val density = resources.displayMetrics.density
        val bgDrawable = GradientDrawable().apply {
            cornerRadius = 6f * density
            setColor(Color.parseColor(bg))
        }
        tvPreviewBadge.background = bgDrawable
        tvPreviewBadge.setTextColor(Color.parseColor(textColor))
        tvPreviewLevel.text = levelName
    }

    private fun setupActionButtons() {
        btnBack.setOnClickListener {
            finish()
        }

        btnAddMacro.setOnClickListener {
            val phrase = etNewPhrase.text.toString().trim()
            if (phrase.isEmpty()) {
                Toast.makeText(this, "Vui lòng nhập từ hoặc cụm từ!", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val targetChar = currentLetter[0]
            val (label, _) = FastMacroDatabase.generateSmartLabel(phrase, targetChar)
            val fullText = if (phrase.endsWith(" ")) phrase else "$phrase "

            val currentMacros = FastMacroDatabase.getMacrosForKey(this, currentLetter).toMutableList()
            // Kiểm tra trùng lặp
            val existingIndex = currentMacros.indexOfFirst { it.fullText.trim().equals(phrase, ignoreCase = true) }
            if (existingIndex >= 0) {
                currentMacros[existingIndex] = MacroItem(label, fullText)
                Toast.makeText(this, "Đã cập nhật nhãn cho từ '$phrase'", Toast.LENGTH_SHORT).show()
            } else {
                currentMacros.add(MacroItem(label, fullText))
                Toast.makeText(this, "Đã thêm từ '$phrase' vào phím [$currentLetter]", Toast.LENGTH_SHORT).show()
            }

            FastMacroDatabase.saveMacrosForKey(this, currentLetter, currentMacros)
            etNewPhrase.setText("")
            loadMacroList()
        }

        btnResetLetter.setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle("Khôi phục mặc định")
                .setMessage("Khôi phục toàn bộ từ tốc ký của phím [ ${currentLetter.uppercase()} ] về mặc định ban đầu?")
                .setPositiveButton("Khôi phục") { _, _ ->
                    FastMacroDatabase.resetMacrosForKey(this, currentLetter)
                    Toast.makeText(this, "Đã khôi phục phím [${currentLetter.uppercase()}]", Toast.LENGTH_SHORT).show()
                    loadMacroList()
                }
                .setNegativeButton("Hủy", null)
                .show()
        }
    }

    private fun loadMacroList() {
        tvSectionTitle.text = "Thêm từ tốc ký cho chữ cái [ ${currentLetter.uppercase()} ]"
        val macros = FastMacroDatabase.getMacrosForKey(this, currentLetter)
        tvListCount.text = "Danh sách hiện có: ${macros.size} từ"

        containerMacroItems.removeAllViews()
        val density = resources.displayMetrics.density

        for (i in macros.indices) {
            val item = macros[i]
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(
                    (8 * density).toInt(),
                    (8 * density).toInt(),
                    (8 * density).toInt(),
                    (8 * density).toInt()
                )
                val rowBg = GradientDrawable().apply {
                    cornerRadius = 6f * density
                    setColor(if (i % 2 == 0) Color.parseColor("#0D1117") else Color.parseColor("#161B22"))
                }
                background = rowBg
                val params = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = (4 * density).toInt()
                }
                layoutParams = params
            }

            // Nhãn Badge
            val (bgHex, textHex) = getMacroColor(item.label)
            val badge = TextView(this).apply {
                text = item.label
                textSize = 12.5f
                setTextColor(Color.parseColor(textHex))
                gravity = Gravity.CENTER
                val badgeBg = GradientDrawable().apply {
                    cornerRadius = 5f * density
                    setColor(Color.parseColor(bgHex))
                }
                background = badgeBg
                setPadding((8 * density).toInt(), (4 * density).toInt(), (8 * density).toInt(), (4 * density).toInt())
                minWidth = (44 * density).toInt()
            }
            row.addView(badge)

            // Cụm từ đầy đủ
            val tvPhrase = TextView(this).apply {
                text = item.fullText.trim()
                textSize = 14f
                setTextColor(Color.parseColor("#E6EDF3"))
                setPadding((10 * density).toInt(), 0, (6 * density).toInt(), 0)
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            row.addView(tvPhrase)

            // Nút xóa
            val btnDel = ImageButton(this).apply {
                setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
                setBackgroundColor(Color.TRANSPARENT)
                setColorFilter(Color.parseColor("#8B949E"))
                layoutParams = LinearLayout.LayoutParams(
                    (36 * density).toInt(),
                    (36 * density).toInt()
                )
                setOnClickListener {
                    val updated = macros.toMutableList()
                    updated.removeAt(i)
                    FastMacroDatabase.saveMacrosForKey(this@MacroSettingsActivity, currentLetter, updated)
                    loadMacroList()
                }
            }
            row.addView(btnDel)

            containerMacroItems.addView(row)
        }
    }

    private fun getMacroColor(label: String): Pair<String, String> {
        val isLevel4 = label.any { it.isDigit() } || label.contains(" ")
        val isLevel2 = label.isNotEmpty() && label[0].isUpperCase()
        val isLevel3 = label.length >= 2 && !isLevel2 && !isLevel4 && label.none { it in "aeiouyáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ" }
        return when {
            isLevel4 -> Pair("#441C22", "#FF7B72")
            isLevel3 -> Pair("#3E2612", "#FFA657")
            isLevel2 -> Pair("#162C46", "#79C0FF")
            else -> Pair("#163326", "#7EE787")
        }
    }
}
