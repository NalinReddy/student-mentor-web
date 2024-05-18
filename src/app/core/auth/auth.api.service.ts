import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { tap, map } from 'rxjs';

@Injectable({providedIn: 'root'})
export class AuthService
{
    /**
     *
     */
    constructor(private http: HttpClient) {
        
    }

    login(email: string, password: string) {
        console.log('AuthService.login');
        return this.http
            .post<any>(`${environment.apiUrl}/users/authenticate`, { email, password })
            .pipe(
                tap((user) => {
                    localStorage.setItem('user', JSON.stringify(user));
                }),
                map((user) => {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('user', JSON.stringify(user));
                    return user;
                })
            );
    }
}