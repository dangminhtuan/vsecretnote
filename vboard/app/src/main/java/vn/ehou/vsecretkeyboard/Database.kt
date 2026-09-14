package vn.ehou.vsecretkeyboard

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Delete
import androidx.room.Database
import androidx.room.RoomDatabase

@Entity(tableName = "notes")
data class Note(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val content: String,
    val isEncrypted: Boolean,
    val timestamp: Long
)

@Dao
interface NoteDao {
    @Query("SELECT * FROM notes ORDER BY timestamp DESC")
    fun getAllNotes(): List<Note>

    @Insert
    fun insertNote(note: Note)

    @Delete
    fun deleteNote(note: Note)
}

@Database(entities = [Note::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun noteDao(): NoteDao
}
