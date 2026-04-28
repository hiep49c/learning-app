# Vocabulary Data Chunks

This directory contains vocabulary data in compact JSON format.
Each chunk file contains ~200 words.

Format per entry (array):
[word, ipa, pronunciation_guide, part_of_speech[], level, meanings[[en,vi,ex_en,ex_vi]], collocations[], synonyms[], antonyms[], topic_ids[]]

Run `npx ts-node scripts/generate-vocabulary.ts` to build the final dataset.
