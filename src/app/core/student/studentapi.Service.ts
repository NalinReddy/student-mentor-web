import { Injectable } from '@angular/core';
import { TrackingService } from '@fuse/services/tracking.service';
import { environment } from 'environments/environment';
import { tap, map, BehaviorSubject, Observable } from 'rxjs';
import { DatafactoryService } from '../datafactory.service';
import { SweetAlertService } from '@fuse/services/sweet-alerts/sweet-alerts.service';
import { Student } from 'app/models/student.model';

@Injectable({providedIn: 'root'})
export class StudentApiService
{
    private _students: BehaviorSubject<Student[]> = new BehaviorSubject<Student[]>([]);
    private dataStore = {
        Students: [],
    }
    constructor(private dataFactory: DatafactoryService, private trackingService: TrackingService, private alertService: SweetAlertService) {
        
    }

    /**
     * Returns an observable list of _Students. Accessible by administrative components only.
     */
    get students(): Observable<Student[]> {
        return this._students.asObservable();
    }

    getAllStudents(university, q?: any) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`StudentsApiService.getAllStudents`);
        let query = "?";
        if (q?.assignedMentors) {
            query += "assignedMentors="+q.assignedMentors+"&";
        }
        if (q?.courses) {
            query += "courses="+q.courses+"&";
        }
        this.dataFactory.postMethod(`${environment.apiUrl}/Students/getAllStudents${query}`, {university}).subscribe(
            (data) => {
                this.dataStore.Students = data;
                this._students.next(Object.assign({}, this.dataStore).Students);
            },
            (error) => {
                console.error(`Failed to retrieve Students. ${error}`);
            }
        );
    }

    deepSearchStudents(params) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`StudentsApiService.deepSearchStudents`);
        this.dataFactory.postMethod(`${environment.apiUrl}/Students/deepSearch`, params).subscribe(
            (data) => {
                this.dataStore.Students = data;
                this._students.next(Object.assign({}, this.dataStore).Students);
            },
            (error) => {
                console.error(`Failed to retrieve Students. ${error}`);
            }
        );
    }

    createStudent(Student: Student) {
        console.info(`StudentsApiService.createStudent`);

            this.trackingService.createTracking(Student);
            return this.dataFactory.postMethod(`${environment.apiUrl}/Students/`, Student).pipe(
                map((result) => {
                    // this.getAllStudents();
                    this.alertService.showToast("success" ,'Student added successfully', 3600);
                    return result;
                })
            );
    }

    editStudent(Student: Student, id: string) {
        console.info(`StudentsApiService.editStudent`);
        
            return this.dataFactory.putMethod(`${environment.apiUrl}/Students/${id}`, Student).pipe(
                map((result) => {
                    // this.getAllStudents();
                    this.alertService.showToast("success" ,'Student updated successfully', 3600);
                    return result;
                })
            );
    }

    searchStudent(searchText: string) {
        console.info(`StudentsApiService.searchStudent`);

            return this.dataFactory.postMethod(`${environment.apiUrl}/students/search/`, {searchText}).pipe(
                map((result) => {
                    return result;
                })
            );
    }

}