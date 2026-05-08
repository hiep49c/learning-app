package com.hiepnt.vietlott.ui.statistics

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.hiepnt.vietlott.data.DrawResultRepository
import com.hiepnt.vietlott.domain.LotteryAnalytics
import com.hiepnt.vietlott.model.VietlottType
import kotlinx.coroutines.launch

data class StatsUiState(
    val hot: List<Pair<Int, Int>> = emptyList(),
    val cold: List<Pair<Int, Int>> = emptyList(),
    val absent: List<Pair<Int, Int>> = emptyList(),
    val pairs: List<Pair<Pair<Int, Int>, Int>> = emptyList()
)

class StatisticsViewModel(app: Application) : AndroidViewModel(app) {

    private val repo = DrawResultRepository(app)
    private val _state = MutableLiveData(StatsUiState())
    val state: LiveData<StatsUiState> = _state

    private val _fetchStatus = MutableLiveData<String>()
    val fetchStatus: LiveData<String> = _fetchStatus

    fun load(type: VietlottType) {
        viewModelScope.launch {
            val count = repo.getCount(type)
            if (count == 0) repo.importFromJson(getApplication(), type)
            val results = repo.getAll(type)
            _state.value = StatsUiState(
                hot = analytics(results).topHot(10),
                cold = analytics(results).topCold(10),
                absent = analytics(results).longestAbsent(type, 10),
                pairs = analytics(results).topPairs(10)
            )
        }
    }

    fun fetchLatest(type: VietlottType) {
        viewModelScope.launch {
            _fetchStatus.value = "Đang tải..."
            val success = repo.fetchLatest(type)
            _fetchStatus.value = if (success) "✅ Đã cập nhật!" else "❌ Không lấy được dữ liệu"
            if (success) load(type)
        }
    }

    private fun analytics(results: List<com.hiepnt.vietlott.data.entity.DrawResult>) = LotteryAnalytics(results)
}
