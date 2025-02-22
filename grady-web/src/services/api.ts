import axios from 'axios';
import { protectedResources } from '../config/authConfig';

// In development, return mock data if API is not running
const isDev = process.env.NODE_ENV === 'development';

const api = axios.create({
  baseURL: isDev ? 'http://localhost:7072/api' : protectedResources.api.endpoint,
});

// Problem Types
export type BasicOperationType = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type FractionOperationType = 'fraction_addition' | 'fraction_subtraction' | 'fraction_multiplication' | 'fraction_division';
export type DecimalOperationType = 'decimal_addition' | 'decimal_subtraction' | 'decimal_multiplication' | 'decimal_division';
export type AlgebraType = 'simple_equations' | 'word_problems' | 'patterns';
export type GeometryType = 'area' | 'perimeter' | 'volume' | 'angles';

export type ProblemType = BasicOperationType | FractionOperationType | DecimalOperationType | AlgebraType | GeometryType;
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type SubmissionMethod = 'web' | 'print' | 'both';

// Categories for organizing problem types
export interface ProblemCategory {
  id: string;
  name: string;
  types: ProblemType[];
  description: string;
}

export const ProblemCategories: ProblemCategory[] = [
  {
    id: 'basic',
    name: 'Basic Operations',
    types: ['addition', 'subtraction', 'multiplication', 'division'],
    description: 'Fundamental arithmetic operations with whole numbers'
  },
  {
    id: 'fractions',
    name: 'Fractions',
    types: ['fraction_addition', 'fraction_subtraction', 'fraction_multiplication', 'fraction_division'],
    description: 'Operations with fractions and mixed numbers'
  },
  {
    id: 'decimals',
    name: 'Decimals',
    types: ['decimal_addition', 'decimal_subtraction', 'decimal_multiplication', 'decimal_division'],
    description: 'Operations with decimal numbers'
  },
  {
    id: 'algebra',
    name: 'Pre-Algebra',
    types: ['simple_equations', 'word_problems', 'patterns'],
    description: 'Basic algebraic concepts and problem solving'
  },
  {
    id: 'geometry',
    name: 'Geometry',
    types: ['area', 'perimeter', 'volume', 'angles'],
    description: 'Basic geometric concepts and calculations'
  }
];

// Configuration for a specific type of problem
export interface ProblemConfig {
  type: ProblemType;
  difficulty: DifficultyLevel;
  count: number;
  options?: {
    maxNumber?: number;
    decimalPlaces?: number;
    includeFractions?: boolean;
    includeNegatives?: boolean;
    wordProblemContext?: string;
  };
}

// A section in the worksheet
export interface WorksheetSection {
  title: string;
  description?: string;
  problems: ProblemConfig[];
}

// Template for reusable worksheet designs
export interface WorksheetTemplate {
  id: string;
  teacherId: string;
  name: string;
  description: string;
  sections: WorksheetSection[];
  dateCreated: string;
  lastUsed: string;
  timesUsed: number;
}

// Request to generate a worksheet
export interface WorksheetRequest {
  teacherId: string;
  title?: string;
  sections: WorksheetSection[];
  templateId?: string;
  saveAsTemplate?: boolean;
  templateName?: string;
}

// Individual math problem
export interface MathProblem {
  id: number;
  question: string;
  answer: number | string;
  type: ProblemType;
  difficulty: DifficultyLevel;
  solution?: string;
  hint?: string;
}

// Complete worksheet
export interface Worksheet {
  id: string;
  teacherId: string;
  dateCreated: string;
  title: string;
  header: string;
  sections: {
    title: string;
    description?: string;
    problems: MathProblem[];
  }[];
  templateId?: string;
  submissionMethod: SubmissionMethod;
  allowCalculator: boolean;
  showAnswers: boolean;
  qrCode: string;
}

export interface SubmissionRequest {
  worksheetId: string;
  imageData: string;
}

// Mock data for development
const mockWorksheet: Worksheet = {
  id: 'mock-1',
  teacherId: 'development-teacher-id',
  dateCreated: new Date().toISOString(),
  title: 'Sample Worksheet',
  header: 'Name___________________ Grade _________________ Room _________',
  sections: [{
    title: 'Basic Operations',
    problems: Array(20).fill(null).map((_, i) => ({
      id: i,
      question: `${Math.floor(Math.random() * 10)} + ${Math.floor(Math.random() * 10)}`,
      answer: Math.floor(Math.random() * 20),
      type: 'addition' as ProblemType,
      difficulty: 'medium' as DifficultyLevel
    }))
  }],
  submissionMethod: 'both' as SubmissionMethod,
  allowCalculator: false,
  showAnswers: true,
  qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
};

const mockTemplate: WorksheetTemplate = {
  id: 'template-1',
  teacherId: 'development-teacher-id',
  name: 'Basic Math Template',
  description: 'Simple addition and subtraction',
  sections: [{
    title: 'Addition',
    problems: [{
      type: 'addition' as ProblemType,
      difficulty: 'medium' as DifficultyLevel,
      count: 10
    }]
  }],
  dateCreated: new Date().toISOString(),
  lastUsed: new Date().toISOString(),
  timesUsed: 5
};

export const ApiService = {
  setAccessToken: (token: string) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  // Get available problem categories and types
  getProblemTypes: () => {
    return ProblemCategories;
  },

  // Get saved templates
  getTemplates: async (teacherId: string) => {
    try {
      if (isDev) {
        return [mockTemplate];
      }
      const response = await api.get(`/templates?teacherId=${teacherId}`);
      return response.data as WorksheetTemplate[];
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  },

  // Save a template
  saveTemplate: async (template: Omit<WorksheetTemplate, 'id' | 'dateCreated' | 'lastUsed' | 'timesUsed'>) => {
    try {
      if (isDev) {
        return { ...mockTemplate, ...template };
      }
      const response = await api.post('/templates', template);
      return response.data as WorksheetTemplate;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  },

  // Generate worksheet
  generateWorksheet: async (request: WorksheetRequest): Promise<Worksheet> => {
    try {
      if (isDev) {
        const mockResponse: Worksheet = {
          ...mockWorksheet,
          title: request.title || mockWorksheet.title,
          sections: request.sections.map(section => ({
            title: section.title,
            problems: Array(section.problems.reduce((sum, p) => sum + p.count, 0))
              .fill(null)
              .map((_, i) => ({
                id: i,
                question: `${Math.floor(Math.random() * 10)} + ${Math.floor(Math.random() * 10)}`,
                answer: Math.floor(Math.random() * 20),
                type: section.problems[0].type,
                difficulty: section.problems[0].difficulty
              }))
          }))
        };
        return mockResponse;
      }
      const response = await api.post('/GenerateWorksheet', request);
      return response.data as Worksheet;
    } catch (error) {
      console.error('Error generating worksheet:', error);
      throw error;
    }
  },

  // Get teacher's worksheets
  getTeacherWorksheets: async (teacherId: string) => {
    try {
      if (isDev) {
        return [mockWorksheet];
      }
      const response = await api.get(`/worksheets?teacherId=${teacherId}`);
      return response.data as Worksheet[];
    } catch (error) {
      console.error('Error loading worksheets:', error);
      return [];
    }
  },

  // Delete worksheet
  deleteWorksheet: async (worksheetId: string, teacherId: string) => {
    try {
      if (isDev) {
        return { success: true };
      }
      const response = await api.delete(`/worksheets/${worksheetId}?teacherId=${teacherId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting worksheet:', error);
      throw error;
    }
  },

  // Process submission
  processSubmission: async (request: SubmissionRequest) => {
    try {
      if (isDev) {
        return { success: true };
      }
      const response = await api.post('/ProcessSubmission', request);
      return response.data;
    } catch (error) {
      console.error('Error processing submission:', error);
      throw error;
    }
  },

  // Export grades
  exportGrades: async (classId: string) => {
    try {
      if (isDev) {
        return { success: true };
      }
      const response = await api.get(`/ExportGrades?classId=${classId}`);
      return response.data;
    } catch (error) {
      console.error('Error exporting grades:', error);
      throw error;
    }
  }
};
