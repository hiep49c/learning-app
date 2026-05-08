package com.hiepnt.vietlott.data

import com.hiepnt.vietlott.data.entity.DrawResult
import com.hiepnt.vietlott.model.VietlottType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL
import java.util.regex.Pattern

object VietlottScraper {

    suspend fun fetchLatest(type: VietlottType): DrawResult? = withContext(Dispatchers.IO) {
        try {
            val url = when (type) {
                VietlottType.MEGA_645 -> "https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/645"
                VietlottType.POWER_655 -> "https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/655"
            }
            val html = URL(url).readText()
            parseResult(html, type)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun parseResult(html: String, type: VietlottType): DrawResult? {
        // Ngày: ngày <b>03/05/2026</b>
        val datePattern = Pattern.compile("""ngày\s*<b>(\d{2}/\d{2}/\d{4})</b>""")
        val dateMatcher = datePattern.matcher(html)
        if (!dateMatcher.find()) return null
        val rawDate = dateMatcher.group(1) ?: return null
        val parts = rawDate.split("/")
        val date = "${parts[2]}-${parts[1]}-${parts[0]}"

        // Số: <span class="bong_tron">07</span>
        val numbers = mutableListOf<Int>()
        val numPattern = Pattern.compile("""<span\s+class="bong_tron[^"]*">\s*(\d{2})\s*</span>""")
        val numMatcher = numPattern.matcher(html)
        while (numMatcher.find()) {
            numMatcher.group(1)?.toIntOrNull()?.let { numbers.add(it) }
        }

        if (numbers.size < type.pickCount) return null

        val mainNumbers = numbers.take(type.pickCount)
        val special = if (type == VietlottType.POWER_655 && numbers.size > type.pickCount) {
            numbers[type.pickCount]
        } else null

        return DrawResult(
            type = type.name,
            date = date,
            numbers = mainNumbers.joinToString(","),
            specialNumber = special
        )
    }
}
