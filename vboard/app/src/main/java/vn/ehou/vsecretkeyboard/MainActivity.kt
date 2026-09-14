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
import com.google.android.material.button.MaterialButton

class MainActivity : AppCompatActivity() {

    private lateinit var tvAccessibilityStatus: TextView
    private lateinit var btnGrantAccessibility: Button
    private lateinit var btnToggleHandsfree: MaterialButton
    private lateinit var btnEnableIme: Button
    private lateinit var btnSelectIme: Button

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
        btnToggleHandsfree = findViewById(R.id.btn_toggle_handsfree)
        btnEnableIme = findViewById(R.id.btn_enable_ime)
        btnSelectIme = findViewById(R.id.btn_select_ime)

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

        // Nút Bật/Tắt Lắng nghe Rảnh tay
        btnToggleHandsfree.setOnClickListener {
            val hasAudioPermission = ContextCompat.checkSelfPermission(
                this, Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED

            if (!hasAudioPermission) {
                checkAndRequestPermissions()
                return@setOnClickListener
            }

            if (!HandsFreeAccessibilityService.isRunning()) {
                Toast.makeText(this, "Vui lòng cấp quyền Trợ Năng trước khi bật rảnh tay!", Toast.LENGTH_LONG).show()
                btnGrantAccessibility.performClick()
                return@setOnClickListener
            }

            if (HandsFreeVoiceService.isServiceRunning) {
                HandsFreeVoiceService.stop(this)
                Toast.makeText(this, "Đã tắt chế độ lắng nghe rảnh tay.", Toast.LENGTH_SHORT).show()
            } else {
                HandsFreeVoiceService.start(this)
                Toast.makeText(this, "Đã BẬT! Giờ bạn có thể nói 'Chiến thôi [nội dung]' bất cứ lúc nào.", Toast.LENGTH_LONG).show()
            }
            updateUIState()
        }

        // Cài đặt Bàn phím IME
        btnEnableIme.setOnClickListener {
            startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS))
        }

        btnSelectIme.setOnClickListener {
            val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
            imm.showInputMethodPicker()
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
        if (isVoiceRunning) {
            btnToggleHandsfree.text = "🔴 TẮT CHẾ ĐỘ LẮNG NGHE RẢNH TAY"
            btnToggleHandsfree.setBackgroundColor(Color.parseColor("#D93025"))
        } else {
            btnToggleHandsfree.text = "🎙️ BẬT CHẾ ĐỘ LẮNG NGHE RẢNH TAY"
            btnToggleHandsfree.setBackgroundColor(Color.parseColor("#1A73E8"))
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
