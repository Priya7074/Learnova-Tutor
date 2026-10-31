import { InterviewQuestion, InterviewFeedback } from '../types.js';

export function evaluateInterviewAnswer(
  question: InterviewQuestion,
  answer: string
): InterviewFeedback {
  const ansTrimmed = answer.trim();
  const lower = ansTrimmed.toLowerCase();

  if (!ansTrimmed || ansTrimmed.length < 20) {
    return {
      scoreOverall: 25,
      technicalScore: 20,
      communicationScore: 30,
      confidenceScore: 30,
      strengths: ['Attempted to respond to the prompt.'],
      improvementAreas: [
        'Answer is overly brief. In technical interviews, structure responses using the STAR method or definition -> mechanism -> trade-offs.',
        'Address concrete trade-offs, time complexities, or system invariants.',
      ],
      suggestedIdealAnswer: question.idealKeyPoints.join('. ') + '.',
      followUpQuestion: 'Could you elaborate on how you would implement this in a production codebase?',
    };
  }

  // Count key points hit
  let matchedPoints = 0;
  for (const kp of question.idealKeyPoints) {
    const words = kp.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const hitCount = words.filter(w => lower.includes(w)).length;
    if (hitCount >= 2) matchedPoints++;
  }

  const lengthFactor = Math.min(ansTrimmed.length / 300, 1.0);
  const ratio = question.idealKeyPoints.length > 0 ? matchedPoints / question.idealKeyPoints.length : 0.5;

  const techScore = Math.min(Math.round(40 + ratio * 55), 98);
  const commScore = Math.min(Math.round(50 + lengthFactor * 45), 96);
  const confScore = Math.min(Math.round(55 + (techScore + commScore) / 4), 95);
  const overall = Math.round((techScore * 0.5) + (commScore * 0.3) + (confScore * 0.2));

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (techScore >= 75) {
    strengths.push('Articulated core theoretical principles and accurate technical terminology.');
  } else {
    improvements.push('Incorporate deeper technical specifics (e.g. mathematical decomposition, algorithmic complexities, or RFC specs).');
  }

  if (commScore >= 75) {
    strengths.push('Logical progression of thought with clear structure.');
  } else {
    improvements.push('Structure your answer more clearly: state the high-level definition first, then explain the underlying mechanism, followed by real-world edge cases.');
  }

  if (lower.includes('trade-off') || lower.includes('versus') || lower.includes('complexity') || lower.includes('memory') || lower.includes('time')) {
    strengths.push('Highlighted engineering trade-offs and resource implications.');
  } else {
    improvements.push('Senior engineers always discuss trade-offs (e.g., latency vs throughput, memory vs compute).');
  }

  return {
    scoreOverall: overall,
    technicalScore: techScore,
    communicationScore: commScore,
    confidenceScore: confScore,
    strengths: strengths.length > 0 ? strengths : ['Clear conversational tone.'],
    improvementAreas: improvements.length > 0 ? improvements : ['Consider providing a concrete production debugging example.'],
    suggestedIdealAnswer: question.idealKeyPoints.join('. ') + '.',
    followUpQuestion: `What is the biggest operational risk or pitfall when scaling this in a high-concurrency environment?`,
  };
}
