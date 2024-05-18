import { Injectable } from '@angular/core';
import { TrackingService } from '@fuse/services/tracking.service';
import { environment } from 'environments/environment';
import { tap, map, BehaviorSubject, Observable } from 'rxjs';
import { DatafactoryService } from '../datafactory.service';
import { SweetAlertService } from '@fuse/services/sweet-alerts/sweet-alerts.service';
import { Professor } from 'app/models/professor.model';

@Injectable({providedIn: 'root'})
export class ProfessorApiService
{
    private _professors: BehaviorSubject<Professor[]> = new BehaviorSubject<Professor[]>([]);
    private dataStore = {
        professors: [],
    }
    constructor(private dataFactory: DatafactoryService, private trackingService: TrackingService, private alertService: SweetAlertService) {
        
    }

    /**
     * Returns an observable list of _professors. Accessible by administrative components only.
     */
    get professors(): Observable<Professor[]> {
        return this._professors.asObservable();
    }

    getAllprofessors(university) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`termsApIServive.getAllprofessors`);
        this.dataFactory.postMethod(`${environment.apiUrl}/professors/getAllProfessors`, {university}).subscribe(
            (data) => {
                this.dataStore.professors = data;
                this._professors.next(Object.assign({}, this.dataStore).professors);
            },
            (error) => {
                console.error(`Failed to retrieve professors. ${error}`);
            }
        );
    }

    createProfessor(term: Professor) {
        console.info(`termsApIServive.createProfessor`);

            this.trackingService.createTracking(term);
            return this.dataFactory.postMethod(`${environment.apiUrl}/professors/`, term).pipe(
                map((result) => {
                    this.alertService.showToast("success" ,'Professor added successfully', 3600);
                    return result;
                })
            );
    }

    editProfessor(Professor: Professor, id: string) {
        console.info(`termsApIServive.editProfessor`);
        
            return this.dataFactory.putMethod(`${environment.apiUrl}/professors/${id}`, Professor).pipe(
                map((result) => {
                    this.alertService.showToast("success" ,'Professor updated successfully', 3600);
                    return result;
                })
            );
    }
}