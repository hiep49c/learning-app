package com.hiepnt.vietlott.ui.statistics

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.hiepnt.vietlott.R
import com.hiepnt.vietlott.databinding.FragmentStatisticsBinding
import com.hiepnt.vietlott.model.VietlottType

class StatisticsFragment : Fragment() {

    private var _binding: FragmentStatisticsBinding? = null
    private val binding get() = _binding!!
    private val viewModel: StatisticsViewModel by viewModels()
    private var currentType = VietlottType.MEGA_645

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentStatisticsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.toggleType.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                currentType = when (checkedId) {
                    R.id.btn_mega -> VietlottType.MEGA_645
                    else -> VietlottType.POWER_655
                }
                viewModel.load(currentType)
            }
        }

        binding.btnFetch.setOnClickListener {
            viewModel.fetchLatest(currentType)
        }

        viewModel.state.observe(viewLifecycleOwner) { state ->
            binding.tvHot.text = state.hot.joinToString("\n") { "Số %02d: %d lần".format(it.first, it.second) }
            binding.tvCold.text = state.cold.joinToString("\n") { "Số %02d: %d lần".format(it.first, it.second) }
            binding.tvAbsent.text = state.absent.joinToString("\n") { "Số %02d: %d kỳ chưa ra".format(it.first, it.second) }
            binding.tvPairs.text = state.pairs.joinToString("\n") { "(%02d, %02d): %d lần".format(it.first.first, it.first.second, it.second) }
        }

        viewModel.fetchStatus.observe(viewLifecycleOwner) { msg ->
            android.widget.Toast.makeText(requireContext(), msg, android.widget.Toast.LENGTH_SHORT).show()
        }

        viewModel.load(currentType)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
