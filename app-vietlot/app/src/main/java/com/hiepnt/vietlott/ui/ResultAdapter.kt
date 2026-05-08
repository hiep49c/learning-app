package com.hiepnt.vietlott.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.hiepnt.vietlott.databinding.ItemResultBinding

class ResultAdapter : RecyclerView.Adapter<ResultAdapter.VH>() {
    private var items: List<List<Int>> = emptyList()

    fun submitList(list: List<List<Int>>) {
        items = list
        notifyDataSetChanged()
    }

    override fun getItemCount() = items.size

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemResultBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holder.binding.tvIndex.text = "#${position + 1}"
        holder.binding.tvNumbers.text = items[position].joinToString(" - ") { "%02d".format(it) }
    }

    class VH(val binding: ItemResultBinding) : RecyclerView.ViewHolder(binding.root)
}
