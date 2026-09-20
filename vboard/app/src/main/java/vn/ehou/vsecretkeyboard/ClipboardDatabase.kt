package vn.ehou.vsecretkeyboard

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Delete
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Update

@Entity(tableName = "clipboard_items")
data class ClipboardItem(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val text: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isPinned: Boolean = false
)

@Dao
interface ClipboardDao {
    @Query("SELECT * FROM clipboard_items ORDER BY isPinned DESC, timestamp DESC")
    fun getAll(): List<ClipboardItem>

    @Query("SELECT * FROM clipboard_items WHERE text = :queryText LIMIT 1")
    fun findByText(queryText: String): ClipboardItem?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insert(item: ClipboardItem): Long

    @Update
    fun update(item: ClipboardItem)

    @Delete
    fun delete(item: ClipboardItem)

    @Query("DELETE FROM clipboard_items WHERE isPinned = 0")
    fun clearUnpinned()

    @Query("SELECT COUNT(*) FROM clipboard_items")
    fun count(): Int

    @Query("DELETE FROM clipboard_items WHERE isPinned = 0 AND id NOT IN (SELECT id FROM clipboard_items WHERE isPinned = 0 ORDER BY timestamp DESC LIMIT :keepCount)")
    fun trimUnpinned(keepCount: Int = 1000)
}

@Database(entities = [ClipboardItem::class], version = 1, exportSchema = false)
abstract class ClipboardDatabase : RoomDatabase() {
    abstract fun clipboardDao(): ClipboardDao

    companion object {
        @Volatile
        private var INSTANCE: ClipboardDatabase? = null

        fun getInstance(context: Context): ClipboardDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ClipboardDatabase::class.java,
                    "vsecret_clipboard_db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
