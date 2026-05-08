package com.hiepnt.vietlott.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.hiepnt.vietlott.model.VietlottType

@Entity(tableName = "draw_results")
data class DrawResult(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: String,          // MEGA_645 or POWER_655
    val date: String,          // yyyy-MM-dd
    val numbers: String,       // comma-separated: "1,5,12,23,34,45"
    val specialNumber: Int? = null
) {
    fun getNumberList(): List<Int> = numbers.split(",").map { it.trim().toInt() }
    fun getVietlottType(): VietlottType = VietlottType.valueOf(type)
}
