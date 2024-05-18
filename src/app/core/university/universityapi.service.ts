import { Injectable } from '@angular/core';
import { TrackingService } from '@fuse/services/tracking.service';
import { environment } from 'environments/environment';
import { tap, map, BehaviorSubject, Observable } from 'rxjs';
import { DatafactoryService } from '../datafactory.service';
import { SweetAlertService } from '@fuse/services/sweet-alerts/sweet-alerts.service';
import { University } from 'app/models/university.model';
import { User } from 'app/models/user.model';

@Injectable({providedIn: 'root'})
export class UniversityApiService
{
    private _universities: BehaviorSubject<University[]> = new BehaviorSubject<University[]>([]);
    private _mentors: BehaviorSubject<User[]> = new BehaviorSubject<User[]>(null);
    private dataStore = {
        universities: [],
        mentors: []
    }
    constructor(private dataFactory: DatafactoryService, private trackingService: TrackingService, private alertService: SweetAlertService) {
        
    }

    /**
     * Returns an observable list of universities. Accessible by administrative components only.
     */
    get universities(): Observable<University[]> {
        return this._universities.asObservable();
    }

    /**
     * Returns an observable list of mentors. Accessible by administrative components only.
     */
    get mentors(): Observable<User[]> {
        return this._mentors.asObservable();
    }

    getAllUniversities(query?) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`universitiesApiService.getAllUniversities`);
        this.dataFactory.getMethod<University[]>(`${environment.apiUrl}/university/`).subscribe(
            (data) => {
                this.dataStore.universities = data;
                this._universities.next(Object.assign({}, this.dataStore).universities);
            },
            (error) => {
                console.error(`Failed to retrieve universities. ${error}`);
            }
        );
    }

    getAssignedMentorsForUniversity(universityId: string) {
        console.log(`universitiesApiService.getAssignedMentorsForUniversity`);
        this.dataFactory.getMethod<University[]>(`${environment.apiUrl}/university/${universityId}/mentors`).subscribe(
            (data) => {
                this.dataStore.mentors = data;
                this._mentors.next(Object.assign({}, this.dataStore).mentors);
            },
            (error) => {
                console.error(`Failed to retrieve mentors. ${error}`);
            }
        );
    }

    register(university: University) {
        console.info(`universitiesApiService.register`);

            this.trackingService.createTracking(university);
            return this.dataFactory.postMethod(`${environment.apiUrl}/university/`, university).pipe(
                map((result) => {
                    this.getAllUniversities();
                    this.alertService.showToast("success" ,'University added successfully', 3600);
                })
            );
    }
}