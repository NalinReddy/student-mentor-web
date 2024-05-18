import { Professor } from "./professor.model";
import { Term } from "./term.model";
import { Tracking } from "./tracking.model";
import { University } from "./university.model";

export class Course {
    id: string;
    name: string;
    term: string | Term;
    termPeriod:
    {
        type: CourseType,
        startWeek: number,
        endWeek: number
    };
    professor: string | Professor;
    university: University | string;
    tasksStats: {
        inProgress: number,
        completed: number,
        notStarted: number,
        total: number
    };
    price: number;
    tracking: Tracking;
    active: boolean;
}

export enum CourseType {
    FullTerm = 'Full-Term', 
    BiTerm1 = 'Bi-Term1', 
    BiTerm2 = 'Bi-Term2'
}
