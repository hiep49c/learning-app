package com.hiepnt.vietlott.model

enum class VietlottType(val displayName: String, val maxNumber: Int, val pickCount: Int) {
    MEGA_645("Mega 6/45", 45, 6),
    POWER_655("Power 6/55", 55, 6)
}
