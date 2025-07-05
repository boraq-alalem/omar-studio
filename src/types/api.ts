
export interface GeneralStats {
  total_theses: number;
  master_theses: number;
  phd_theses: number;
  total_authors: number;
  total_universities: number;
  total_specializations: number;
}

export interface University {
  id: number;
  name: string;
}

export interface Specialization {
  id: number;
  name: string;
}

export interface Degree {
  id: number;
  name: string;
}

export interface Author {
  id: number;
  name: string;
}

export interface Thesis {
  id: number;
  title: string;
  year: string;
  pdf_path: string;
  university: University;
  specialization: Specialization;
  degree: Degree;
  author: Author;
}

export interface ThesisResponse {
  data: Thesis[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface ThesisGuest {
  title: string;
  year: string;
  pdf_path: string;
  university: string;
  specialization: string;
  degree: string;
  author: string;
}

export interface AddThesisResponse {
  message: string;
  thesis: Thesis; // Assuming the created thesis object is returned
  author_name: string;
}

export interface UpdateThesisResponse {
  message: string;
  thesis: Thesis; // Assuming the updated thesis object is returned
}

export interface ArchiveThesisResponse {
  message: string;
}

export interface ThesisYear extends String {}

export interface UniversityWithSpecializationsAdmin {
  id: number;
  name: string;
  specializations: Specialization[];
}

export interface UniversityWithSpecializationsGuest {
  id: number;
  name: string;
  specializations: string[];
}

export interface AddSpecializationToUniversityResponse {
  message: string;
}

export interface ArchivedThesis extends Thesis {} // Structure is the same as Thesis

export interface RestoreArchivedThesisResponse {
  message: string;
}

export interface DeleteThesisResponse { // For both archive and permanent delete from theses
  message: string;
}

export interface ReservedThesisTitle {
  id: number;
  title: string;
  person_name: string;
  university: string;
  specialization: string;
  degree: string;
  date: string; // Assuming YYYY-MM-DD or similar string format
}

export interface ReservedThesisTitleGuest {
  title: string;
  person_name: string;
  university: string;
}

export interface AddReservedTitleResponse extends ReservedThesisTitle {}

export interface UpdateReservedTitleResponse extends ReservedThesisTitle {}

export interface DeleteReservedTitleResponse {
  message: string;
}

export type ApiError = {
  message: string;
  errors?: Record<string, string[]>;
};
