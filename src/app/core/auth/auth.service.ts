import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SweetAlertService } from '@fuse/services/sweet-alerts/sweet-alerts.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/models/user.model';
import { environment } from 'environments/environment';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';

@Injectable({providedIn: 'root'})
export class AuthService
{
    private _authenticated: boolean = false;
    refreshToken: any;

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService,
        private sweetAlerts: SweetAlertService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string)
    {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any>
    {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any>
    {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any>
    {
        // Throw error, if the user is already logged in
        if ( this._authenticated )
        {
            return throwError('User is already logged in.');
        }
        // `${environment.apiUrl}/users/authenticate`  'api/auth/sign-in'
        return this._httpClient.post(`${environment.apiUrl}/users/authenticate`, credentials, { observe: 'response', withCredentials: true }).pipe(
            switchMap((response: any) =>
            {
                console.log(response);
                const user = response.body;
                // Store the access token in the local storage
                this.accessToken = user.jwtToken;
              
                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = user;

                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('user', JSON.stringify(user));

                // Return a new observable with the response
                return of(response);
            }),
        );
    }

    getCookie(name: string): string {
        const value = `; ${document.cookie}`;
        console.log(value);
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()!.split(';').shift()!;
        return '';
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any>
    {
        // Sign in using the token
        // 'api/auth/sign-in-with-token'
        return this._httpClient.post(`${environment.apiUrl}/users/refresh-token`, {
            accessToken: localStorage.getItem("accessToken"),
        },{ observe: 'response', withCredentials: true }).pipe(
            catchError(() =>

                // Return false
                of(false),
            ),
            switchMap((response: any) =>
            {
                if (!response) return of(false); 

                const user = response.body;

                // Replace the access token with the new one if it's available on
                // the response object.
                //
                // This is an added optional step for better security. Once you sign
                // in using the token, you should generate a new one on the server
                // side and attach it to the response object. Then the following
                // piece of code can replace the token with the refreshed one.
                this.accessToken = user.jwtToken;

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = user;

                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('user', JSON.stringify(user));
                console.log("augthentication success return");
                // this.sweetAlerts.prompt("info", "Successfully auto resigned due to Token expired, Please continue", "Ok");
                // Return true
                return of(true);
            }),
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any>
    {
        

        return this._httpClient.post(`${environment.apiUrl}/users/revoke-token`, {}, {withCredentials: true})
        .pipe(map(res => {

            localStorage.clear();

            // Set the authenticated flag to false
            this._authenticated = false;
        }))


        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any>
    {
        return this._httpClient.post(`${environment.apiUrl}/users/register`, user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any>
    {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean>
    {
        const user = JSON.parse(localStorage.getItem("user") || "{}") as User; 
            
        // Check the access token availability
        if ( !this.accessToken)
        {
            return of(false);
        }

        // Check the access token expire date
        if (!AuthUtils.isTokenExpired(this.accessToken) && user.jwtToken)
        {
            // Set the authenticated flag to true
            this._authenticated = true;
            // Store the user on the user service
            this._userService.user = user;
            
            return of(true);
        }
        
        return of(false);
        // // If the access token exists, and it is expired, silently sign in using refreshtoken (And if refresh token is also expired itwill navigate to login page)
        // return this.signInUsingToken();
    }
}
