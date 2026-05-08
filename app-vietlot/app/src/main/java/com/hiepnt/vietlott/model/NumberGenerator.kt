package com.hiepnt.vietlott.model

import kotlin.random.Random

object NumberGenerator {

    fun generate(type: VietlottType): List<Int> {
        val pool = (1..type.maxNumber).toMutableList()
        // Trộn nhiều lần
        repeat(5) { pool.shuffle() }
        // Lấy ngẫu nhiên 6 vị trí khác nhau
        val positions = (pool.indices).toMutableList()
        repeat(3) { positions.shuffle() }
        val picked = mutableSetOf<Int>()
        while (picked.size < type.pickCount) {
            val pos = Random.nextInt(pool.size)
            picked.add(pool[pos])
        }
        return picked.sorted()
    }

    fun generateMultiple(type: VietlottType, count: Int): List<List<Int>> {
        return (1..count).map { generate(type) }
    }
}
