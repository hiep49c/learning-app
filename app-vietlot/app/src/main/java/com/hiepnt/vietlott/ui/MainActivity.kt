package com.hiepnt.vietlott.ui

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.hiepnt.vietlott.R
import com.hiepnt.vietlott.databinding.ActivityMainBinding
import com.hiepnt.vietlott.ui.history.HistoryFragment
import com.hiepnt.vietlott.ui.random.RandomFragment
import com.hiepnt.vietlott.ui.recommend.RecommendFragment
import com.hiepnt.vietlott.ui.statistics.StatisticsFragment

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (savedInstanceState == null) {
            switchFragment(RandomFragment())
        }

        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_random -> switchFragment(RandomFragment())
                R.id.nav_history -> switchFragment(HistoryFragment())
                R.id.nav_statistics -> switchFragment(StatisticsFragment())
                R.id.nav_recommend -> switchFragment(RecommendFragment())
            }
            true
        }
    }

    private fun switchFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .commit()
    }
}
