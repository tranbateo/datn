export class CreateQuestionDto {
  quizId: string;
  content: string;
  options: any; // array or json
  correctOption: string;
  explanation?: string;
}

export class CreateQuizDto {
  title: string;
  description?: string;
  grade?: number;
  subjectId?: string;
  duration?: number;
  isGraduation?: boolean;
}
