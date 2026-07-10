export class SubmitQuizDto {
  answers: { questionId: string; selectedOption: string }[];
}
