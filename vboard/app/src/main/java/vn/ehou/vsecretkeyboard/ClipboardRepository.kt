package vn.ehou.vsecretkeyboard

import android.content.Context
import android.os.Handler
import android.os.Looper
import java.util.concurrent.Executors

object ClipboardRepository {
    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    fun saveCopiedText(context: Context, rawText: String, callback: ((ClipboardItem) -> Unit)? = null) {
        val clean = rawText.trim()
        if (clean.isEmpty()) return

        executor.execute {
            val dao = ClipboardDatabase.getInstance(context).clipboardDao()
            val existing = dao.findByText(clean)
            val itemToReturn: ClipboardItem
            if (existing != null) {
                val updated = existing.copy(timestamp = System.currentTimeMillis())
                dao.update(updated)
                itemToReturn = updated
            } else {
                val newItem = ClipboardItem(
                    text = clean,
                    timestamp = System.currentTimeMillis(),
                    isPinned = false
                )
                val id = dao.insert(newItem)
                dao.trimUnpinned(1000)
                itemToReturn = newItem.copy(id = id)
            }
            if (callback != null) {
                mainHandler.post { callback(itemToReturn) }
            }
        }
    }

    fun loadAll(context: Context, callback: (List<ClipboardItem>) -> Unit) {
        executor.execute {
            val dao = ClipboardDatabase.getInstance(context).clipboardDao()
            val list = dao.getAll()
            mainHandler.post { callback(list) }
        }
    }

    fun togglePin(context: Context, item: ClipboardItem, callback: (() -> Unit)? = null) {
        executor.execute {
            val dao = ClipboardDatabase.getInstance(context).clipboardDao()
            val updated = item.copy(isPinned = !item.isPinned)
            dao.update(updated)
            if (callback != null) {
                mainHandler.post { callback() }
            }
        }
    }

    fun deleteItem(context: Context, item: ClipboardItem, callback: (() -> Unit)? = null) {
        executor.execute {
            val dao = ClipboardDatabase.getInstance(context).clipboardDao()
            dao.delete(item)
            if (callback != null) {
                mainHandler.post { callback() }
            }
        }
    }

    fun clearUnpinned(context: Context, callback: (() -> Unit)? = null) {
        executor.execute {
            val dao = ClipboardDatabase.getInstance(context).clipboardDao()
            dao.clearUnpinned()
            if (callback != null) {
                mainHandler.post { callback() }
            }
        }
    }
}
