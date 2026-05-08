package com.hiepnt.vietlott.ui.recommend

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.hiepnt.vietlott.R
import com.hiepnt.vietlott.databinding.FragmentRecommendBinding
import com.hiepnt.vietlott.domain.RecommendationEngine
import com.hiepnt.vietlott.model.VietlottType
import com.hiepnt.vietlott.ui.ResultAdapter

class RecommendFragment : Fragment() {

    private var _binding: FragmentRecommendBinding? = null
    private val binding get() = _binding!!
    private val viewModel: RecommendViewModel by viewModels()
    private val adapter = ResultAdapter()
    private var currentType = VietlottType.MEGA_645
    private var currentStrategy = RecommendationEngine.Strategy.RANDOM

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentRecommendBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.recyclerView.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerView.adapter = adapter

        binding.toggleType.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                currentType = when (checkedId) {
                    R.id.btn_mega -> VietlottType.MEGA_645
                    else -> VietlottType.POWER_655
                }
            }
        }

        binding.chipGroupStrategy.setOnCheckedStateChangeListener { _, checkedIds ->
            currentStrategy = when (checkedIds.firstOrNull()) {
                R.id.chip_hot -> RecommendationEngine.Strategy.HIGH_FREQUENCY
                R.id.chip_mix -> RecommendationEngine.Strategy.MIX_HOT_COLD
                R.id.chip_avoid -> RecommendationEngine.Strategy.AVOID_RECENT
                else -> RecommendationEngine.Strategy.RANDOM
            }
        }

        binding.btnGenerate.setOnClickListener {
            viewModel.generate(currentType, currentStrategy, 5)
        }

        viewModel.results.observe(viewLifecycleOwner) { adapter.submitList(it) }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
