import { Course } from "./course.model";
import { Student } from "./student.model";
import { Topic } from "./topic.model";
import { Tracking } from "./tracking.model";
import { University } from "./university.model";
import { User } from "./user.model";

export class Task {
    id: string;
    title: string;
    studentId: string;
    student: Student;
    joiningDate: Date;
    profComments: string;
    profPref: string;
    grade: string;
    discussions: string | {[key: string] : any};
    repliesStatus: string | {[key: string] : any};
    // courseType: { type: Schema.Types.ObjectId, ref: 'CourseType' },
    course: Course;
    description: string;
    week: string;
    topics: string[] | Topic[];
    taskStats: {
        inProgress: number;
        completed: number;
        notStarted: number;
        total: number
    };
    mentorAssigned: string[] | User[];
    university: University | string;
    status: TaskStatus;
    tags: any;
    dueDate: string;
    priority: number;
    tracking: Tracking;
    active: boolean;
    isExpanded?: boolean;
    previewIcon?: string;
    type?: 'section' | 'task';
    completed?: boolean;
}

export enum TaskStatus {
    NOT_STARTED = 'Not started',
    IN_PROGRESS = 'In progress',
    COMPLETED = 'Completed'
}
