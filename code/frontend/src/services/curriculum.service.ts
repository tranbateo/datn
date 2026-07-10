import { fetchApi } from '../lib/api-client';

export interface Subject {
  id: string;
  name: string;
  grade: number;
  description?: string;
}

export const curriculumService = {
  getSubjectsByGrade: (grade: number): Promise<Subject[]> => {
    return fetchApi(`/curriculum/subjects?grade=${grade}`);
  }
};
