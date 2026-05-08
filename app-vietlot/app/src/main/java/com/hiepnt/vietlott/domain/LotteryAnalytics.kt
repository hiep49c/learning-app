package com.hiepnt.vietlott.domain

import com.hiepnt.vietlott.data.entity.DrawResult
import com.hiepnt.vietlott.model.VietlottType

/**
 * Phân tích thống kê kết quả xổ số.
 * Lưu ý: Đây chỉ là thống kê lịch sử, KHÔNG dự đoán kết quả tương lai.
 */
class LotteryAnalytics(private val results: List<DrawResult>) {

    private val allNumbers: List<List<Int>> by lazy {
        results.map { it.getNumberList() }
    }

    // === FREQUENCY ANALYSIS ===

    fun frequencyMap(): Map<Int, Int> {
        val freq = mutableMapOf<Int, Int>()
        allNumbers.forEach { nums -> nums.forEach { freq[it] = (freq[it] ?: 0) + 1 } }
        return freq
    }

    fun topHot(n: Int): List<Pair<Int, Int>> =
        frequencyMap().entries.sortedByDescending { it.value }.take(n).map { it.key to it.value }

    fun topCold(n: Int): List<Pair<Int, Int>> =
        frequencyMap().entries.sortedBy { it.value }.take(n).map { it.key to it.value }

    // === GAP ANALYSIS ===

    /** Số kỳ kể từ lần cuối mỗi số xuất hiện (0 = vừa ra kỳ gần nhất) */
    fun gapMap(type: VietlottType): Map<Int, Int> {
        val gap = mutableMapOf<Int, Int>()
        for (num in 1..type.maxNumber) {
            val idx = allNumbers.indexOfFirst { num in it }
            gap[num] = if (idx == -1) results.size else idx
        }
        return gap
    }

    /** Số lâu chưa ra nhất */
    fun longestAbsent(type: VietlottType, n: Int): List<Pair<Int, Int>> =
        gapMap(type).entries.sortedByDescending { it.value }.take(n).map { it.key to it.value }

    // === COMBINATION ANALYSIS ===

    /** Cặp số hay đi cùng nhau, trả về top N cặp */
    fun topPairs(n: Int): List<Pair<Pair<Int, Int>, Int>> {
        val pairCount = mutableMapOf<Pair<Int, Int>, Int>()
        allNumbers.forEach { nums ->
            for (i in nums.indices) {
                for (j in i + 1 until nums.size) {
                    val pair = nums[i] to nums[j]
                    pairCount[pair] = (pairCount[pair] ?: 0) + 1
                }
            }
        }
        return pairCount.entries.sortedByDescending { it.value }.take(n).map { it.key to it.value }
    }
}
