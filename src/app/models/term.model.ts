import { Tracking } from "./tracking.model";
import { University } from "./university.model";

export class Term {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    university: University | string;
    tracking: Tracking;
    active: boolean;
}
