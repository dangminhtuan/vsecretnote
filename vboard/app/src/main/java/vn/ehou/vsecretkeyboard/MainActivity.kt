package vn.ehou.vsecretkeyboard

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.card.MaterialCardView
import com.google.android.material.switchmaterial.SwitchMaterial

class MainActivity : AppCompatActivity() {

    private lateinit var tvAccessibilityStatus: TextView
    private lateinit var btnGrantAccessibility: Button
    private lateinit var cardSwitchContainer: MaterialCardView
    private lateinit var switchHandsfree: SwitchMaterial
    private lateinit var tvSwitchSubtitle: TextView
    private lateinit var btnEnableIme: Button
    private lateinit var btnSelectIme: Button
    private lateinit var btnOpenMacroSettings: Button

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val recordAudioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        if (recordAudioGranted) {
            Toast.makeText(this, "Đã cấp quyền Micro thành công!", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Cần cấp quyền Micro để dùng tính năng rảnh tay!", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvAccessibilityStatus = findViewById(R.id.tv_accessibility_status)
        btnGrantAccessibility = findViewById(R.id.btn_grant_accessibility)
        cardSwitchContainer = findViewById(R.id.card_switch_container)
        switchHandsfree = findViewById(R.id.switch_handsfree)
        tvSwitchSubtitle = findViewById(R.id.tv_switch_subtitle)
        btnEnableIme = findViewById(R.id.btn_enable_ime)
        btnSelectIme = findViewById(R.id.btn_select_ime)
        btnOpenMacroSettings = findViewById(R.id.btn_open_macro_settings)

        setupListeners()
        checkAndRequestPermissions()
    }

    override fun onResume() {
        super.onResume()
        updateUIState()
    }

    private fun setupListeners() {
        // Nút cấp quyền Trợ Năng
        btnGrantAccessibility.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
            Toast.makeText(this, "Hãy tìm 'Vboard' trong danh sách và BẬT quyền Trợ năng!", Toast.LENGTH_LONG).show()
        }

        // Bấm vào bất kỳ đâu trên card cũng gạt công tắc
        cardSwitchContainer.setOnClickListener {
            switchHandsfree.isChecked = !switchHandsfree.isChecked
        }

        // Sự kiện gạt công tắc Rảnh tay
        switchHandsfree.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                val hasAudioPermission = ContextCompat.checkSelfPermission(
                    this, Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED

                if (!hasAudioPermission) {
                    switchHandsfree.isChecked = false
                    checkAndRequestPermissions()
                    return@setOnCheckedChangeListener
                }

                if (!HandsFreeAccessibilityService.isRunning()) {
                    switchHandsfree.isChecked = false
                    Toast.makeText(this, "Vui lòng cấp quyền Trợ Năng trước khi bật rảnh tay!", Toast.LENGTH_LONG).show()
                    btnGrantAccessibility.performClick()
                    return@setOnCheckedChangeListener
                }

                if (!HandsFreeVoiceService.isServiceRunning) {
                    HandsFreeVoiceService.start(this)
                    Toast.makeText(this, "Đã BẬT! Nói 'Chiến thôi [nội dung]' bất cứ lúc nào.", Toast.LENGTH_SHORT).show()
                }
            } else {
                if (HandsFreeVoiceService.isServiceRunning) {
                    HandsFreeVoiceService.stop(this)
                    Toast.makeText(this, "Đã tắt chế độ lắng nghe rảnh tay.", Toast.LENGTH_SHORT).show()
                }
            }
            updateSwitchVisual(isChecked)
        }

        // Cài đặt Bàn phím IME
        btnEnableIme.setOnClickListener {
            startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS))
        }

        btnSelectIme.setOnClickListener {
            val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
            imm.showInputMethodPicker()
        }

        btnOpenMacroSettings.setOnClickListener {
            val intent = Intent(this, MacroSettingsActivity::class.java)
            startActivity(intent)
        }

        findViewById<Button>(R.id.btn_open_guide).setOnClickListener {
            val intent = Intent(this, GuideActivity::class.java)
            startActivity(intent)
        }
    }

    private fun updateUIState() {
        val isAccessibilityActive = HandsFreeAccessibilityService.isRunning()
        if (isAccessibilityActive) {
            tvAccessibilityStatus.text = "Trợ Năng: ĐÃ BẬT (Sẵn sàng) ✅"
            tvAccessibilityStatus.setTextColor(Color.parseColor("#0F9D58"))
            btnGrantAccessibility.isEnabled = false
            btnGrantAccessibility.text = "Đã cấp"
        } else {
            tvAccessibilityStatus.text = "Trợ Năng: CHƯA BẬT ⚠️"
            tvAccessibilityStatus.setTextColor(Color.parseColor("#D93025"))
            btnGrantAccessibility.isEnabled = true
            btnGrantAccessibility.text = "Cấp quyền"
        }

        val isVoiceRunning = HandsFreeVoiceService.isServiceRunning
        switchHandsfree.isChecked = isVoiceRunning
        updateSwitchVisual(isVoiceRunning)
    }

    private fun updateSwitchVisual(isRunning: Boolean) {
        if (isRunning) {
            tvSwitchSubtitle.text = "🟢 Đang hoạt động: Sẵn sàng nghe 'Chiến thôi'..."
            tvSwitchSubtitle.setTextColor(Color.parseColor("#0F9D58"))
            cardSwitchContainer.setCardBackgroundColor(Color.parseColor("#E6F4EA"))
            cardSwitchContainer.strokeColor = Color.parseColor("#34A853")
        } else {
            tvSwitchSubtitle.text = "⚪ Đang tắt: Gạt sang để kích hoạt rảnh tay"
            tvSwitchSubtitle.setTextColor(Color.parseColor("#5F6368"))
            cardSwitchContainer.setCardBackgroundColor(Color.parseColor("#F1F3F4"))
            cardSwitchContainer.strokeColor = Color.parseColor("#DADCE0")
        }
    }

    private fun checkAndRequestPermissions() {
        val permissionsNeeded = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.RECORD_AUDIO)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (permissionsNeeded.isNotEmpty()) {
            requestPermissionLauncher.launch(permissionsNeeded.toTypedArray())
        }
    }
}
