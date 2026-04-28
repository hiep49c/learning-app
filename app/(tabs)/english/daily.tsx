/**
 * DailyLearningScreen — main flow screen for daily vocabulary learning.
 * 7 steps: warmup → learn → deep → practice → output → review → summary
 */
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, ProgressBar, Text, TextInput, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { router } from 'expo-router';

import { useDailyLearnStore } from '@/stores/dailyLearnStore';
import type { DailyStep } from '@/stores/dailyLearnStore';
import { useAuthStore } from '@/stores/authStore';
import { FlashCard } from '@/components/FlashCard';
import { DeepCard } from '@/components/DeepCard';
import { PracticeCard } from '@/components/PracticeCard';
import { ReviewCard } from '@/components/ReviewCard';
import { DailySummary } from '@/components/DailySummary';
import type { WordData, PracticeQuestion } from '@/services/DailyLearningService';

const STEP_LABELS: Record<DailyStep, string> = {
  warmup: '🔄 Khởi động',
  learn: '📖 Học từ mới',
  deep: '🔍 Hiểu sâu',
  practice: '✏️ Luyện tập',
  output: '✍️ Viết câu',
  review: '🧠 Ôn tập SR',
  summary: '📊 Tổng kết',
};

const STEP_ORDER: DailyStep[] = ['warmup', 'learn', 'deep', 'practice', 'output', 'review', 'summary'];

export default function DailyLearningScreen(): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  const { currentUser } = useAuthStore();
  const store = useDailyLearnStore();
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const userId = currentUser?.id ?? '';

  useEffect(() => {
    if (userId) void store.startSession(userId);
    return () => { store.reset(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleNext = useCallback((): void => {
    if (userId) void store.nextStep(userId);
  }, [userId, store]);

  const handleFinish = useCallback((): void => {
    store.reset();
    router.back();
  }, [store]);

  const handleReviewCard = useCallback(async (cardId: string, result: 'perfect' | 'good' | 'hard' | 'forgot'): Promise<void> => {
    if (isReviewing) return;
    setIsReviewing(true);
    try {
      await store.reviewCard(userId, cardId, result);
    } finally {
      setIsReviewing(false);
    }
  }, [userId, store, isReviewing]);

  const handleSubmitPractice = useCallback(async (): Promise<void> => {
    await store.submitPractice(userId);
    setPracticeSubmitted(true);
  }, [userId, store]);

  if (store.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" accessibilityLabel="Đang tải bài học" />
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
          Đang chuẩn bị bài học...
        </Text>
      </View>
    );
  }

  if (store.error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.error }}>{store.error}</Text>
        <Button mode="contained" onPress={() => store.startSession(userId)} style={{ marginTop: 16 }}>
          Thử lại
        </Button>
      </View>
    );
  }

  // Progress bar
  const stepIdx = STEP_ORDER.indexOf(store.currentStep);
  const progress = (stepIdx + 1) / STEP_ORDER.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <IconButton icon="close" onPress={handleFinish} accessibilityLabel="Đóng" />
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, flex: 1, textAlign: 'center' }}>
            {STEP_LABELS[store.currentStep]}
          </Text>
          <View style={{ width: 48 }} />
        </View>
        <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {store.currentStep === 'warmup' && (
          <WarmupStep
            cards={store.warmupCards}
            index={store.currentCardIndex}
            onNext={store.nextCard}
            onPrev={store.prevCard}
            onFinishStep={handleNext}
          />
        )}
        {store.currentStep === 'learn' && (
          <LearnStep
            cards={store.newWords}
            index={store.currentCardIndex}
            onNext={store.nextCard}
            onPrev={store.prevCard}
            onFinishStep={handleNext}
          />
        )}
        {store.currentStep === 'deep' && (
          <DeepStep
            cards={store.newWords}
            index={store.currentCardIndex}
            onNext={store.nextCard}
            onPrev={store.prevCard}
            onFinishStep={handleNext}
          />
        )}
        {store.currentStep === 'practice' && (
          <PracticeStep
            questions={store.practiceQuestions}
            answers={store.practiceAnswers}
            onAnswer={store.answerPractice}
            submitted={practiceSubmitted}
            onSubmit={handleSubmitPractice}
            onFinishStep={handleNext}
          />
        )}
        {store.currentStep === 'output' && (
          <OutputStep
            words={store.newWords}
            sentences={store.userSentences}
            onSave={store.saveUserSentence}
            onFinishStep={handleNext}
          />
        )}
        {store.currentStep === 'review' && (
          <ReviewStep
            cards={store.reviewCards}
            index={store.currentCardIndex}
            onRate={handleReviewCard}
            isSubmitting={isReviewing}
            onFinishStep={handleNext}
          />
        )}
        {store.currentStep === 'summary' && store.summary && (
          <DailySummary summary={store.summary} onFinish={handleFinish} />
        )}
      </View>
    </View>
  );
}

// ─── Step Components ───

interface CardStepProps {
  cards: WordData[];
  index: number;
  onNext: () => void;
  onPrev: () => void;
  onFinishStep: () => void;
}

function WarmupStep({ cards, index, onNext, onPrev, onFinishStep }: CardStepProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  if (cards.length === 0) return <EmptyStep message="Không có từ cần ôn" onNext={onFinishStep} />;
  const card = cards[index];
  if (!card) return <StepDone onNext={onFinishStep} />;

  return (
    <View style={styles.stepContainer}>
      <Text variant="bodySmall" style={[styles.counter, { color: theme.colors.onSurfaceVariant }]}>
        {index + 1} / {cards.length}
      </Text>
      <FlashCard word={card} />
      <NavButtons index={index} total={cards.length} onPrev={onPrev} onNext={onNext} onFinish={onFinishStep} />
    </View>
  );
}

function LearnStep({ cards: words, index, onNext, onPrev, onFinishStep }: CardStepProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  if (words.length === 0) return <EmptyStep message="Không có từ mới" onNext={onFinishStep} />;
  const word = words[index];
  if (!word) return <StepDone onNext={onFinishStep} />;

  return (
    <View style={styles.stepContainer}>
      <Text variant="bodySmall" style={[styles.counter, { color: theme.colors.onSurfaceVariant }]}>
        {index + 1} / {words.length}
      </Text>
      <FlashCard word={word} showBack />
      <NavButtons index={index} total={words.length} onPrev={onPrev} onNext={onNext} onFinish={onFinishStep} />
    </View>
  );
}

function DeepStep({ cards: words, index, onNext, onPrev, onFinishStep }: CardStepProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  if (words.length === 0) return <EmptyStep message="Không có dữ liệu" onNext={onFinishStep} />;
  const word = words[index];
  if (!word) return <StepDone onNext={onFinishStep} />;

  return (
    <View style={styles.stepContainer}>
      <Text variant="bodySmall" style={[styles.counter, { color: theme.colors.onSurfaceVariant }]}>
        {index + 1} / {words.length}
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DeepCard word={word} />
      </ScrollView>
      <NavButtons index={index} total={words.length} onPrev={onPrev} onNext={onNext} onFinish={onFinishStep} />
    </View>
  );
}

interface PracticeStepProps {
  questions: PracticeQuestion[];
  answers: Record<string, string>;
  onAnswer: (qId: string, answer: string) => void;
  submitted: boolean;
  onSubmit: () => Promise<void>;
  onFinishStep: () => void;
}

function PracticeStep({ questions, answers, onAnswer, submitted, onSubmit, onFinishStep }: PracticeStepProps): React.JSX.Element {
  if (questions.length === 0) return <EmptyStep message="Không đủ từ để luyện tập" onNext={onFinishStep} />;

  return (
    <View style={styles.stepContainer}>
      <FlatList
        data={questions}
        keyExtractor={(q) => q.id}
        renderItem={({ item }) => (
          <PracticeCard
            question={item}
            selectedAnswer={answers[item.id]}
            onAnswer={onAnswer}
            showResult={submitted}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.practiceFooter}>
            {!submitted ? (
              <Button mode="contained" onPress={onSubmit} disabled={Object.keys(answers).length === 0}>
                Nộp bài
              </Button>
            ) : (
              <Button mode="contained" onPress={onFinishStep}>
                Tiếp tục
              </Button>
            )}
          </View>
        }
      />
    </View>
  );
}

interface OutputStepProps {
  words: WordData[];
  sentences: Record<string, string>;
  onSave: (cardId: string, sentence: string) => void;
  onFinishStep: () => void;
}

function OutputStep({ words, sentences, onSave, onFinishStep }: OutputStepProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();

  return (
    <View style={styles.stepContainer}>
      <FlatList
        data={words}
        keyExtractor={(w) => w.cardId}
        renderItem={({ item }) => (
          <View style={styles.outputCard}>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>{item.word}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.meaningVi}</Text>
            <TextInput
              mode="outlined"
              label="Viết câu với từ này"
              value={sentences[item.cardId] ?? ''}
              onChangeText={(text) => onSave(item.cardId, text)}
              multiline
              style={styles.outputInput}
              accessibilityLabel={`Viết câu với từ ${item.word}`}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <Button mode="contained" onPress={onFinishStep} style={styles.practiceFooter}>
            Tiếp tục
          </Button>
        }
      />
    </View>
  );
}

interface ReviewStepProps {
  cards: WordData[];
  index: number;
  onRate: (cardId: string, result: 'perfect' | 'good' | 'hard' | 'forgot') => Promise<void>;
  isSubmitting: boolean;
  onFinishStep: () => void;
}

function ReviewStep({ cards, index, onRate, isSubmitting, onFinishStep }: ReviewStepProps): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  if (cards.length === 0) return <EmptyStep message="Không có từ cần ôn tập" onNext={onFinishStep} />;
  const card = cards[index];
  if (!card) return <StepDone onNext={onFinishStep} />;

  return (
    <View style={styles.stepContainer}>
      <Text variant="bodySmall" style={[styles.counter, { color: theme.colors.onSurfaceVariant }]}>
        {index + 1} / {cards.length}
      </Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ReviewCard word={card} onRate={(result) => void onRate(card.cardId, result)} isSubmitting={isSubmitting} />
      </ScrollView>
    </View>
  );
}

// ─── Shared UI ───

function NavButtons({ index, total, onPrev, onNext, onFinish }: { index: number; total: number; onPrev: () => void; onNext: () => void; onFinish: () => void }): React.JSX.Element {
  const isLast = index >= total - 1;
  return (
    <View style={styles.navRow}>
      <Button mode="outlined" onPress={onPrev} disabled={index === 0} accessibilityLabel="Trước">← Trước</Button>
      {isLast ? (
        <Button mode="contained" onPress={onFinish} accessibilityLabel="Tiếp tục">Tiếp tục →</Button>
      ) : (
        <Button mode="contained" onPress={onNext} accessibilityLabel="Tiếp">Tiếp →</Button>
      )}
    </View>
  );
}

function EmptyStep({ message, onNext }: { message: string; onNext: () => void }): React.JSX.Element {
  const theme = useTheme<MD3Theme>();
  return (
    <View style={styles.center}>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>{message}</Text>
      <Button mode="contained" onPress={onNext} style={{ marginTop: 16 }}>Tiếp tục</Button>
    </View>
  );
}

function StepDone({ onNext }: { onNext: () => void }): React.JSX.Element {
  return (
    <View style={styles.center}>
      <Text variant="bodyLarge">✅ Hoàn thành bước này!</Text>
      <Button mode="contained" onPress={onNext} style={{ marginTop: 16 }}>Tiếp tục</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: { paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  progressBar: { marginHorizontal: 16, marginTop: 4, borderRadius: 4 },
  content: { flex: 1 },
  stepContainer: { flex: 1, paddingTop: 8 },
  counter: { textAlign: 'center', marginBottom: 4 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, gap: 12 },
  practiceFooter: { padding: 16 },
  outputCard: { marginHorizontal: 16, marginVertical: 8, gap: 4 },
  outputInput: { marginTop: 4 },
});
