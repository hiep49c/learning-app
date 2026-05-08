package com.hiepnt.vietlott.data

import android.content.Context
import com.hiepnt.vietlott.data.entity.DrawResult
import com.hiepnt.vietlott.model.VietlottType
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.Flow

class DrawResultRepository(context: Context) {

    private val dao = VietlottDatabase.getInstance(context).drawResultDao()

    fun getByType(type: VietlottType): Flow<List<DrawResult>> = dao.getByType(type.name)

    suspend fun getAll(type: VietlottType): List<DrawResult> = dao.getAllByType(type.name)

    suspend fun getRecent(type: VietlottType, limit: Int): List<DrawResult> = dao.getRecent(type.name, limit)

    suspend fun getCount(type: VietlottType): Int = dao.getCount(type.name)

    suspend fun fetchLatest(type: VietlottType): Boolean {
        val result = VietlottScraper.fetchLatest(type) ?: return false
        dao.insertAll(listOf(result))
        return true
    }

    suspend fun importFromJson(context: Context, type: VietlottType) {
        val fileName = when (type) {
            VietlottType.MEGA_645 -> "mega645_results.json"
            VietlottType.POWER_655 -> "power655_results.json"
        }
        val json = context.assets.open(fileName).bufferedReader().readText()
        val listType = object : TypeToken<List<DrawResultJson>>() {}.type
        val items: List<DrawResultJson> = Gson().fromJson(json, listType)
        val entities = items.map {
            DrawResult(
                type = type.name,
                date = it.date,
                numbers = it.numbers.joinToString(","),
                specialNumber = it.specialNumber
            )
        }
        dao.insertAll(entities)
    }

    private data class DrawResultJson(
        val date: String,
        val numbers: List<Int>,
        val specialNumber: Int? = null
    )
}
