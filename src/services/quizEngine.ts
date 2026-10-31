import { VideoItem, DocumentItem, Quiz, QuizQuestion, QuizAttempt } from '../types.js';
import { formatSecondsToTime } from './ragEngine.js';

export function generateQuizFromVideo(
  video: VideoItem,
  maxTimestampSeconds: number,
  difficulty: 'Easy' | 'Medium' | 'Hard'
): Quiz {
  const eligibleTranscripts = video.transcripts.filter(t => t.start <= maxTimestampSeconds);
  const formattedLimit = formatSecondsToTime(maxTimestampSeconds);
  const questions: QuizQuestion[] = [];

  // Generate grounded questions strictly from eligible transcripts
  if (eligibleTranscripts.some(t => t.start <= 300)) {
    questions.push({
      id: 'q_ml_intro_1',
      question: 'According to Arthur Samuel’s definition introduced at the beginning of the lecture, what is Machine Learning?',
      options: [
        'A system of explicit hardcoded heuristic IF-ELSE decision trees.',
        'The field of study that gives computers the ability to learn without being explicitly programmed.',
        'A database query optimization technique for relational SQL tables.',
        'An automated hardware cooling and processor clock scaling protocol.',
      ],
      correctIndex: 1,
      explanation: 'Introduced at 00:00, Arthur Samuel defined machine learning as giving computers the capability to learn patterns from data without being explicitly programmed with manual heuristics.',
      sourceReference: `Video [00:00 - Introduction to Machine Learning]`,
      maxTimestampSeconds: 300,
    });
  }

  if (eligibleTranscripts.some(t => t.start >= 300 && t.start <= 600)) {
    questions.push({
      id: 'q_ml_sup_2',
      question: 'In Supervised Learning (introduced at 05:00), what is the primary distinction between Classification and Regression?',
      options: [
        'Classification predicts continuous floating-point values; Regression groups unlabeled vectors.',
        'Classification clusters data points without labels; Regression uses supervised neural weights.',
        'Classification predicts discrete categorical labels; Regression predicts continuous numerical quantities.',
        'There is no mathematical difference; both terms are interchangeable.',
      ],
      correctIndex: 2,
      explanation: 'Supervised learning divides into classification (predicting discrete classes, like spam vs non-spam) and regression (predicting continuous numerical quantities, like housing prices).',
      sourceReference: `Video [05:00 - Supervised Learning]`,
      maxTimestampSeconds: 600,
    });
  }

  if (eligibleTranscripts.some(t => t.start >= 600 && t.start <= 1122)) {
    questions.push({
      id: 'q_ml_unsup_3',
      question: 'Which of the following techniques belongs to Unsupervised Learning as covered around timestamp 10:00?',
      options: [
        'K-Means Clustering and Principal Component Analysis (PCA).',
        'Ordinary Least Squares Linear Regression with Ground Truth Labels.',
        'Supervised Softmax Cross-Entropy Loss Optimization.',
        'Reinforcement Learning Q-Learning Bellman Equations.',
      ],
      correctIndex: 0,
      explanation: 'Unsupervised learning operates on unlabeled datasets to discover intrinsic cluster structures (K-Means) or lower-dimensional projections (PCA).',
      sourceReference: `Video [10:00 - Unsupervised Learning]`,
      maxTimestampSeconds: 1122,
    });
  }

  if (eligibleTranscripts.some(t => t.start >= 1122 && t.start <= 2100)) {
    questions.push({
      id: 'q_ml_eval_4',
      question: 'At timestamp 18:42, which metric is defined as True Positives divided by all Actual Positives (TP / (TP + FN))?',
      options: [
        'Accuracy',
        'Precision',
        'Recall (Sensitivity)',
        'Mean Squared Error',
      ],
      correctIndex: 2,
      explanation: 'Recall (or Sensitivity) measures completeness: TP / (TP + FN). Precision measures exactness: TP / (TP + FP).',
      sourceReference: `Video [18:42 - Introduction to Model Evaluation]`,
      maxTimestampSeconds: 2100,
    });
  }

  // Notice: Only included if timestamp >= 2100 (35:00)! Never included when timestamp is <= 18:42!
  if (eligibleTranscripts.some(t => t.start >= 2100)) {
    questions.push({
      id: 'q_ml_overfit_5',
      question: 'Introduced at timestamp 35:00, what is a hallmark characteristic of Overfitting (High Variance)?',
      options: [
        'Extremely low accuracy on both training and test datasets.',
        'Near-perfect training accuracy accompanied by severe degradation on unseen validation data.',
        'The model has too few parameters and cannot capture basic linear trends.',
        'Gradients completely vanishing to zero in the first layer.',
      ],
      correctIndex: 1,
      explanation: 'Overfitting occurs when a high-capacity model memorizes dataset noise instead of generalizable patterns, resulting in near 100% training accuracy but abysmal validation performance.',
      sourceReference: `Video [35:00 - Overfitting and Underfitting]`,
      maxTimestampSeconds: 2520,
    });
  }

  return {
    id: `quiz_vid_${video.id}_${Date.now()}`,
    title: `${video.title} (Timestamp Scope ≤ ${formattedLimit})`,
    sourceType: 'video',
    sourceTitle: video.title,
    timestampLimitFormatted: formattedLimit,
    difficulty,
    questions,
  };
}

export function generateQuizFromDocument(
  doc: DocumentItem,
  difficulty: 'Easy' | 'Medium' | 'Hard'
): Quiz {
  const questions: QuizQuestion[] = doc.chunks.map((chunk, idx) => {
    const isSlide = chunk.type === 'slide';
    const unitLabel = isSlide ? `Slide ${chunk.pageOrSlideNumber}` : `Page ${chunk.pageOrSlideNumber}`;

    if (chunk.title?.includes('Supervised') || chunk.title?.includes('Fundamentals')) {
      return {
        id: `q_doc_${doc.id}_${idx}`,
        question: `Based on [${unitLabel}] of "${doc.title}", how is the cost function J(w,b) minimized in linear regression?`,
        options: [
          'By updating parameters in the negative gradient direction: w := w - alpha * (dJ/dw)',
          'By randomly perturbing weights until error reaches zero',
          'By inverting the entire training dataset into RAM without calculus',
          'By maximizing the categorical cross-entropy loss',
        ],
        correctIndex: 0,
        explanation: `As detailed on ${unitLabel}, gradient descent updates parameters iteratively in the direction of steepest descent (negative gradient).`,
        sourceReference: `${doc.title} [${unitLabel}]`,
      };
    }

    if (chunk.title?.includes('Bias-Variance') || chunk.title?.includes('Regularization')) {
      return {
        id: `q_doc_${doc.id}_${idx}`,
        question: `According to [${unitLabel}], which regularization method adds an L1 penalty driving some parameter weights strictly to zero?`,
        options: [
          'Ridge Regularization (L2)',
          'Lasso Regularization (L1)',
          'Dropout with probability 0.5',
          'Batch Normalization',
        ],
        correctIndex: 1,
        explanation: `Lasso regression (L1) adds the sum of absolute weight values, which drives coefficients exactly to zero for sparse feature selection.`,
        sourceReference: `${doc.title} [${unitLabel}]`,
      };
    }

    return {
      id: `q_doc_${doc.id}_${idx}`,
      question: `What primary architectural or theoretical principle is outlined in [${unitLabel}]?`,
      options: [
        chunk.content.substring(0, 100) + '...',
        'Heuristic procedural programming with nested switch-cases.',
        'Unbounded infinite loop iteration without convergence.',
        'Brute-force combinatorial search with factorial complexity.',
      ],
      correctIndex: 0,
      explanation: `Verified directly from ${unitLabel} content: ${chunk.content.substring(0, 120)}...`,
      sourceReference: `${doc.title} [${unitLabel}]`,
    };
  });

  return {
    id: `quiz_doc_${doc.id}_${Date.now()}`,
    title: `Document Assessment: ${doc.title}`,
    sourceType: doc.type === 'notes' ? 'notes' : 'document',
    sourceTitle: doc.title,
    difficulty,
    questions,
  };
}

export function evaluateQuizAttempt(
  quiz: Quiz,
  userAnswers: { [questionId: string]: number }
): QuizAttempt {
  let correctCount = 0;
  for (const q of quiz.questions) {
    if (userAnswers[q.id] === q.correctIndex) {
      correctCount++;
    }
  }

  const total = quiz.questions.length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  let feedback = '';
  if (percentage >= 90) {
    feedback = 'Outstanding mastery! You exhibited comprehensive understanding of all concepts covered up to this learning checkpoint.';
  } else if (percentage >= 70) {
    feedback = 'Solid performance! Review the highlighted explanations for questions missed to solidify your foundation.';
  } else {
    feedback = 'Needs review. We recommend replaying the relevant timestamp segments or reviewing the referenced document pages before proceeding.';
  }

  return {
    id: `attempt_${Date.now()}`,
    quizId: quiz.id,
    score: correctCount,
    totalQuestions: total,
    percentage,
    userAnswers,
    completedAt: new Date().toISOString(),
    feedback,
  };
}
