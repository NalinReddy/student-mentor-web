import { University } from "./university.model";

export class Professor {
    title: string;
    firstName: string;
    lastName: string;
    university: string | University;
    tracking: any;
    active: boolean;
    id: string;
}