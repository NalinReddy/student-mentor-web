import { Course } from "app/models/course.model";
import { Student } from "app/models/student.model";
import { University } from "app/models/university.model";
import { User } from "app/models/user.model";

export interface Tag
{
    id?: string;
    title?: string;
}

export interface Task
{    
    id: string;
    type: 'task' | 'section';
    title: string;
    notes?: string;
    completed: boolean;
    dueDate: string | null;
    priority: 0 | 1 | 2;
    tags: string[];
    order: number;
    // Database props
    course: Course | string;
    university: University | string;
    mentorAssigned: User | string;
    week: number;
    studentId: string;
    student: Student | string;
    saved?: boolean;
    // For topics
    reply?: any;
    discussion?: any;
    topic?: any;
}
