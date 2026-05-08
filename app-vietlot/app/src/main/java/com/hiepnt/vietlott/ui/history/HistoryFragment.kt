package com.hiepnt.vietlott.ui.history

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.hiepnt.vietlott.R
import com.hiepnt.vietlott.data.DrawResultRepository
import com.hiepnt.vietlott.data.entity.DrawResult
import com.hiepnt.vietlott.databinding.FragmentHistoryBinding
import com.hiepnt.vietlott.databinding.ItemHistoryBinding
import com.hiepnt.vietlott.model.VietlottType
import kotlinx.coroutines.launch

class HistoryFragment : Fragment() {

    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!
    private val adapter = HistoryAdapter()
    private var currentType = VietlottType.MEGA_645

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHistoryBinding.inflate(inflater, container, false)
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
                loadHistory()
            }
        }
        loadHistory()
    }

    private fun loadHistory() {
        lifecycleScope.launch {
            val repo = DrawResultRepository(requireContext())
            val count = repo.getCount(currentType)
            if (count == 0) repo.importFromJson(requireContext(), currentType)
            val results = repo.getAll(currentType)
            adapter.submitList(results)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class HistoryAdapter : RecyclerView.Adapter<HistoryAdapter.VH>() {
    private var items: List<DrawResult> = emptyList()

    fun submitList(list: List<DrawResult>) {
        items = list
        notifyDataSetChanged()
    }

    override fun getItemCount() = items.size

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemHistoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = items[position]
        holder.binding.tvDate.text = item.date
        val nums = item.getNumberList().joinToString(" - ") { "%02d".format(it) }
        val special = if (item.specialNumber != null) "  ⚡${"%02d".format(item.specialNumber)}" else ""
        holder.binding.tvNumbers.text = nums + special
    }

    class VH(val binding: ItemHistoryBinding) : RecyclerView.ViewHolder(binding.root)
}
