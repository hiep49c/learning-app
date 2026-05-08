package com.hiepnt.vietlott.ui.random

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.hiepnt.vietlott.R
import com.hiepnt.vietlott.databinding.FragmentRandomBinding
import com.hiepnt.vietlott.model.VietlottType
import com.hiepnt.vietlott.ui.ResultAdapter
import com.hiepnt.vietlott.ui.VietlottViewModel

class RandomFragment : Fragment() {

    private var _binding: FragmentRandomBinding? = null
    private val binding get() = _binding!!
    private val viewModel: VietlottViewModel by viewModels()
    private val adapter = ResultAdapter()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentRandomBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.recyclerView.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerView.adapter = adapter

        binding.toggleGroup.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                when (checkedId) {
                    R.id.btn_mega -> viewModel.selectType(VietlottType.MEGA_645)
                    R.id.btn_power -> viewModel.selectType(VietlottType.POWER_655)
                }
            }
        }

        binding.btnRandomOne.setOnClickListener { viewModel.generateOne() }
        binding.btnRandomMultiple.setOnClickListener {
            val input = EditText(requireContext()).apply { hint = "Số lượng (1-20)" }
            AlertDialog.Builder(requireContext())
                .setTitle("Random nhiều dãy")
                .setView(input)
                .setPositiveButton("OK") { _, _ ->
                    val count = input.text.toString().toIntOrNull()?.coerceIn(1, 20) ?: 5
                    viewModel.generateMultiple(count)
                }
                .setNegativeButton("Hủy", null)
                .show()
        }
        binding.btnClear.setOnClickListener { viewModel.clear() }

        viewModel.results.observe(viewLifecycleOwner) { adapter.submitList(it) }
        viewModel.selectedType.observe(viewLifecycleOwner) { binding.tvTitle.text = it.displayName }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
