import { UserTracking } from "./tracking.model";

export class University {
    id: string;
    name: string;
    courses: [];
    professors: [];
    students: [];
    active: boolean;
    tracking: UserTracking;
    
    constructor() {
        this.tracking = new UserTracking();
    }
    
}