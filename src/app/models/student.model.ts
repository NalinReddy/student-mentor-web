import { Course } from "./course.model";
import { Tracking } from "./tracking.model";
import { University } from "./university.model";
import { User } from "./user.model";

export class Student {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    personalEmail: string;
    eduEmail: string;
    eduPassword: string;
    assignedMentors: User[];
    courses: Course[];
    university: University | string;
    tracking: Tracking;
    active: boolean;
    contactNumber: any;
    courseType: any;
}