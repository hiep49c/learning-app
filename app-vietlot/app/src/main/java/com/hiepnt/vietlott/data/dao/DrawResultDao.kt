package com.hiepnt.vietlott.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.hiepnt.vietlott.data.entity.DrawResult
import kotlinx.coroutines.flow.Flow

@Dao
interface DrawResultDao {

    @Query("SELECT * FROM draw_results WHERE type = :type ORDER BY date DESC")
    fun getByType(type: String): Flow<List<DrawResult>>

    @Query("SELECT * FROM draw_results WHERE type = :type ORDER BY date DESC")
    suspend fun getAllByType(type: String): List<DrawResult>

    @Query("SELECT * FROM draw_results WHERE type = :type ORDER BY date DESC LIMIT :limit")
    suspend fun getRecent(type: String, limit: Int): List<DrawResult>

    @Query("SELECT COUNT(*) FROM draw_results WHERE type = :type")
    suspend fun getCount(type: String): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(results: List<DrawResult>)

    @Query("DELETE FROM draw_results WHERE type = :type")
    suspend fun deleteByType(type: String)
}
