import { Injectable } from '@angular/core';
import { TrackingService } from '@fuse/services/tracking.service';
import { environment } from 'environments/environment';
import { tap, map, BehaviorSubject, Observable } from 'rxjs';
import { DatafactoryService } from '../datafactory.service';
import { SweetAlertService } from '@fuse/services/sweet-alerts/sweet-alerts.service';
import { Term } from 'app/models/term.model';

@Injectable({providedIn: 'root'})
export class TermApiService
{
    private _terms: BehaviorSubject<Term[]> = new BehaviorSubject<Term[]>([]);
    private dataStore = {
        terms: [],
    }
    constructor(private dataFactory: DatafactoryService, private trackingService: TrackingService, private alertService: SweetAlertService) {
        
    }

    /**
     * Returns an observable list of _terms. Accessible by administrative components only.
     */
    get terms(): Observable<Term[]> {
        return this._terms.asObservable();
    }

    getAllterms(university) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`termsApIServive.getAllterms`);
        this.dataFactory.postMethod(`${environment.apiUrl}/terms/getAllTerms`, {university}).subscribe(
            (data) => {
                this.dataStore.terms = data;
                this._terms.next(Object.assign({}, this.dataStore).terms);
            },
            (error) => {
                console.error(`Failed to retrieve terms. ${error}`);
            }
        );
    }

    createTerm(term: Term) {
        console.info(`termsApIServive.createTerm`);

            this.trackingService.createTracking(term);
            return this.dataFactory.postMethod(`${environment.apiUrl}/terms/`, term).pipe(
                map((result) => {
                    this.alertService.showToast("success" ,'Term added successfully', 3600);
                    return result;
                })
            );
    }

    editTerm(Term: Term, id: string) {
        console.info(`termsApIServive.editStudent`);
        
            return this.dataFactory.putMethod(`${environment.apiUrl}/terms/${id}`, Term).pipe(
                map((result) => {
                    this.alertService.showToast("success" ,'Term updated successfully', 3600);
                    return result;
                })
            );
    }
}