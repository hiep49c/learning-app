package com.hiepnt.vietlott.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.hiepnt.vietlott.data.dao.DrawResultDao
import com.hiepnt.vietlott.data.entity.DrawResult

@Database(entities = [DrawResult::class], version = 2, exportSchema = false)
abstract class VietlottDatabase : RoomDatabase() {

    abstract fun drawResultDao(): DrawResultDao

    companion object {
        @Volatile
        private var INSTANCE: VietlottDatabase? = null

        fun getInstance(context: Context): VietlottDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(context.applicationContext, VietlottDatabase::class.java, "vietlott.db")
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
