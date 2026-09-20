package vn.ehou.vsecretkeyboard

import android.os.Bundle
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

class GuideActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_guide)

        findViewById<ImageButton>(R.id.btn_back_guide).setOnClickListener {
            finish()
        }
    }
}
