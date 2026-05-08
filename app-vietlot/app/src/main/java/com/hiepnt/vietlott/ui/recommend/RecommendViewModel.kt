package com.hiepnt.vietlott.ui.recommend

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.hiepnt.vietlott.data.DrawResultRepository
import com.hiepnt.vietlott.domain.RecommendationEngine
import com.hiepnt.vietlott.model.VietlottType
import kotlinx.coroutines.launch

class RecommendViewModel(app: Application) : AndroidViewModel(app) {

    private val repo = DrawResultRepository(app)
    private val _results = MutableLiveData<List<List<Int>>>(emptyList())
    val results: LiveData<List<List<Int>>> = _results

    fun generate(type: VietlottType, strategy: RecommendationEngine.Strategy, count: Int = 5) {
        viewModelScope.launch {
            val dbCount = repo.getCount(type)
            if (dbCount == 0) repo.importFromJson(getApplication(), type)
            val data = repo.getAll(type)
            val engine = RecommendationEngine(data, type)
            _results.value = engine.recommend(strategy, count)
        }
    }
}
