import { Injectable } from '@angular/core';
import { TrackingService } from '@fuse/services/tracking.service';
import { environment } from 'environments/environment';
import { tap, map, BehaviorSubject, Observable } from 'rxjs';
import { DatafactoryService } from '../datafactory.service';
import { SweetAlertService } from '@fuse/services/sweet-alerts/sweet-alerts.service';
import { Course } from 'app/models/course.model';

@Injectable({providedIn: 'root'})
export class CourseApiService
{
    private _courses: BehaviorSubject<Course[]> = new BehaviorSubject<Course[]>([]);
    private dataStore = {
        courses: [],
    }
    constructor(private dataFactory: DatafactoryService, private trackingService: TrackingService, private alertService: SweetAlertService) {
        
    }

    /**
     * Returns an observable list of _courses. Accessible by administrative components only.
     */
    get courses(): Observable<Course[]> {
        return this._courses.asObservable();
    }

    getAllcourses(university) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`coursesApiService.getAllcourses`);
        this.dataFactory.postMethod(`${environment.apiUrl}/courses/getAllCourses`, {university}).subscribe(
            (data) => {
                this.dataStore.courses = data;
                this._courses.next(Object.assign({}, this.dataStore).courses);
            },
            (error) => {
                console.error(`Failed to retrieve courses. ${error}`);
            }
        );
    }

    createCourse(course: Course) {
        console.info(`coursesApiService.createCourse`);

            this.trackingService.createTracking(course);
            return this.dataFactory.postMethod(`${environment.apiUrl}/courses/`, course).pipe(
                map((result) => {
                    // this.getAllcourses();
                    this.alertService.showToast("success" ,'Course added successfully', 3600);
                    return result;
                })
            );
    }

    editCourse(Course: Course, id: string) {
        console.info(`coursesApiService.editStudent`);
        
            return this.dataFactory.putMethod(`${environment.apiUrl}/courses/${id}`, Course).pipe(
                map((result) => {
                    this.alertService.showToast("success" ,'Course updated successfully', 3600);
                    return result;
                })
            );
    }
}