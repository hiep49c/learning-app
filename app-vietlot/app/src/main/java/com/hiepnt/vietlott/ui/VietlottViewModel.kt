package com.hiepnt.vietlott.ui

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.hiepnt.vietlott.model.NumberGenerator
import com.hiepnt.vietlott.model.VietlottType

class VietlottViewModel : ViewModel() {

    private val _selectedType = MutableLiveData(VietlottType.MEGA_645)
    val selectedType: LiveData<VietlottType> = _selectedType

    private val _results = MutableLiveData<List<List<Int>>>(emptyList())
    val results: LiveData<List<List<Int>>> = _results

    fun selectType(type: VietlottType) {
        _selectedType.value = type
        _results.value = emptyList()
    }

    fun generateOne() {
        val type = _selectedType.value ?: return
        val current = _results.value.orEmpty().toMutableList()
        current.add(NumberGenerator.generate(type))
        _results.value = current
    }

    fun generateMultiple(count: Int) {
        val type = _selectedType.value ?: return
        val current = _results.value.orEmpty().toMutableList()
        current.addAll(NumberGenerator.generateMultiple(type, count))
        _results.value = current
    }

    fun clear() {
        _results.value = emptyList()
    }
}
