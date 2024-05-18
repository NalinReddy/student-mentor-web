import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TrackingService } from '@fuse/services/tracking.service';
import { User } from 'app/models/user.model';
import { environment } from 'environments/environment';
import { tap, map, BehaviorSubject, Observable } from 'rxjs';
import { DatafactoryService } from '../datafactory.service';
import { SweetAlertService } from '@fuse/services/sweet-alerts/sweet-alerts.service';

@Injectable({providedIn: 'root'})
export class UsersApiService
{
    private _loggedInUserStats: BehaviorSubject<{}> = new BehaviorSubject<{}>({});
    private _users: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
    private _members: BehaviorSubject<{[mentorId: string]: User[]}> = new BehaviorSubject<{[mentorId: string]: User[]}>({});
    private dataStore: {users: User[], loggedInUserStats: {}, members: {[mentorId: string]: User[]}} = {
        users: [],
        members: {},
        loggedInUserStats: {}
    }
    constructor(private dataFactory: DatafactoryService, private trackingService: TrackingService, private alertService: SweetAlertService) {
        
    }

    /**
     * Returns an observable list of users. Accessible by administrative components only.
     */
    get users(): Observable<User[]> {
        return this._users.asObservable();
    }

    /**
     * Returns an observable list of users. Accessible by administrative components only.
     */
    get members(): Observable<{[mentorId: string]: User[]}> {
        return this._members.asObservable();
    }

    /**
     * Returns an observable list of users. Accessible by administrative components only.
     */
    get loggedInUserStats(): Observable<{}> {
        return this._loggedInUserStats.asObservable();
    }

    getAllUsers(query?) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`UsersApiService.getAllUsers`);
        this.dataFactory.getMethod<User[]>(`${environment.apiUrl}/users`).subscribe(
            (data) => {
                this.dataStore.users = data;
                this._users.next(Object.assign({}, this.dataStore).users);
            },
            (error) => {
                console.error(`Failed to retrieve users. ${error}`);
            }
        );
    }

    register(user: User) {
        console.info(`UsersApiService.register`);

            // sanitize the phone
            if (user.phones?.length) {
                for (const phone of user.phones) {
                    phone.number = phone.number?.replace(/-/g, '');
                }
            }

            this.trackingService.createUserTracking(user);
            return this.dataFactory.postMethod(`${environment.apiUrl}/users/register`, user).pipe(
                map((result) => {
                    this.getAllUsers();
                    this.alertService.showToast("success" ,'User registered successfully', 3600);
                })
            );
    }

    editUser(user: User, userId: string) {
        console.info(`UsersApiService.editUser`);

            // sanitize the phone
            if (user.phones?.length) {
                for (const phone of user.phones) {
                    phone.number = phone.number?.replace(/-/g, '');
                }
            }

            this.trackingService.createUserTracking(user);
            return this.dataFactory.putMethod(`${environment.apiUrl}/users/${userId}`, user).pipe(
                map((result) => {
                    this.getAllUsers();
                    this.alertService.showToast("success" ,'User updated successfully', 3600);
                })
            );
    }

    createMember(user: User, mentorId: string) {
        console.info(`UsersApiService.createMember`);

            // sanitize the phone
            if (user.phones?.length) {
                for (const phone of user.phones) {
                    phone.number = phone.number?.replace(/-/g, '');
                }
            }

            this.trackingService.createUserTracking(user);
            return this.dataFactory.postMethod(`${environment.apiUrl}/users/${mentorId}/createMember`, user).pipe(
                map((result) => {
                    this.getAllMembers(mentorId);
                    this.alertService.showToast("success" ,'Member created successfully', 3600);
                })
            );
    }

    
    getAllMembers(mentorId: string) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`UsersApiService.getAllMembers`);
        this.dataFactory.getMethod<User[]>(`${environment.apiUrl}/users//${mentorId}/members`).subscribe(
            (data) => {
                this.dataStore.members[mentorId] = data;
                this._members.next(Object.assign({}, this.dataStore).members);
            },
            (error) => {
                console.error(`Failed to retrieve users. ${error}`);
            }
        );
    }

    getLoggedInUserStats() {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`UsersApiService.getLoggedInUserStats`);
        this.dataFactory.getMethod<User[]>(`${environment.apiUrl}/users/getLoggedInUserStats`).subscribe(
            (data) => {
                this.dataStore.loggedInUserStats = data;
                this._loggedInUserStats.next(Object.assign({}, this.dataStore).loggedInUserStats);
            },
            (error) => {
                console.error(`Failed to retrieve stats. ${error}`);
            }
        );
    }
}