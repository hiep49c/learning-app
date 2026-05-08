package com.hiepnt.vietlott.domain

import com.hiepnt.vietlott.data.entity.DrawResult
import com.hiepnt.vietlott.model.VietlottType

/**
 * Engine gợi ý dãy số dựa trên thống kê lịch sử.
 * ⚠️ KHÔNG cam kết trúng thưởng - chỉ là gợi ý tham khảo.
 */
class RecommendationEngine(
    private val results: List<DrawResult>,
    private val type: VietlottType
) {
    private val analytics = LotteryAnalytics(results)

    enum class Strategy(val displayName: String) {
        RANDOM("Ngẫu nhiên"),
        HIGH_FREQUENCY("Số nóng (xuất hiện nhiều)"),
        MIX_HOT_COLD("Kết hợp nóng + lạnh"),
        AVOID_RECENT("Tránh số vừa ra gần đây")
    }

    fun recommend(strategy: Strategy, count: Int = 1): List<List<Int>> =
        (1..count).map { generateOne(strategy) }

    private fun generateOne(strategy: Strategy): List<Int> = when (strategy) {
        Strategy.RANDOM -> randomPick()
        Strategy.HIGH_FREQUENCY -> highFrequencyPick()
        Strategy.MIX_HOT_COLD -> mixHotColdPick()
        Strategy.AVOID_RECENT -> avoidRecentPick()
    }

    private fun randomPick(): List<Int> =
        (1..type.maxNumber).shuffled().take(type.pickCount).sorted()

    private fun highFrequencyPick(): List<Int> {
        val hot = analytics.topHot(type.maxNumber / 2).map { it.first }
        return hot.shuffled().take(type.pickCount).sorted()
    }

    private fun mixHotColdPick(): List<Int> {
        val hotCount = type.pickCount / 2
        val coldCount = type.pickCount - hotCount
        val hot = analytics.topHot(15).map { it.first }.shuffled().take(hotCount)
        val cold = analytics.topCold(15).map { it.first }
            .filter { it !in hot }.shuffled().take(coldCount)
        val result = (hot + cold).toMutableList()
        // Fill nếu thiếu
        while (result.size < type.pickCount) {
            val extra = (1..type.maxNumber).filter { it !in result }.random()
            result.add(extra)
        }
        return result.sorted()
    }

    private fun avoidRecentPick(): List<Int> {
        val recentNumbers = results.take(3).flatMap { it.getNumberList() }.toSet()
        val pool = (1..type.maxNumber).filter { it !in recentNumbers }
        return if (pool.size >= type.pickCount) {
            pool.shuffled().take(type.pickCount).sorted()
        } else {
            (1..type.maxNumber).shuffled().take(type.pickCount).sorted()
        }
    }
}
