import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {  Router } from '@angular/router';
import { SweetAlertService } from '@fuse/services/sweet-alerts/sweet-alerts.service';

@Injectable({
  providedIn: "root",
})
export class DatafactoryService {
  
  url: any;
  token: any;
  isOffline: boolean;
  showAlert = false;

  constructor(
    public _httpClient: HttpClient, private sweetAlerts: SweetAlertService,
    private router: Router
  ) {
  }

  postMethod(url: string, params?, options?) {
    const cancelRequest = new Subject<void>();

    this.token = sessionStorage.getItem("accessToken");
    const headers = new HttpHeaders()
      .set("Accept", "application/json")
      .set("Content-Type", "application/json;charset=utf-8")
      .set("Access-Control-Allow-Origin", "*")
      .set("Authorization", "Bearer " + this.token);
    return this._httpClient
      .post(url, params, { headers: headers, ...options })
      .pipe(
        takeUntil(cancelRequest),
        tap((data: any) => {
          return data;
        }), 
        catchError(this.catchHttpError.bind(this))
        );
  }
  putMethod(url: string, params?, options?) {
    const cancelRequest = new Subject<void>();

    this.token = sessionStorage.getItem("accessToken");
    const headers = new HttpHeaders()
      .set("Accept", "application/json")
      .set("Content-Type", "application/json;charset=utf-8")
      .set("Access-Control-Allow-Origin", "*")
      .set("Authorization", "Bearer " + this.token);
    return this._httpClient
      .put(url, params, { headers: headers, ...options })
      .pipe(
        takeUntil(cancelRequest),
        tap((data: any) => {
          return data;
        }), 
        catchError(this.catchHttpError.bind(this))
        );
  }
  postAnonymousMethod(url: string, params?, options?) {
    const headers = new HttpHeaders()
      .set("Accept", "application/json")
      .set("Content-Type", "application/json;charset=utf-8")
      .set("Access-Control-Allow-Origin", "*");
    return this._httpClient
      .post(url, params, { headers: headers, ...options })
      .pipe(
        tap((data: any) => {
          if (
            !!data?.length &&
            data[0].responseCode === 3 &&
            (data[0].response === "Failure" || data[0].response === "failure")
          ) {
           
            this.sweetAlerts.prompt("success", data[0]?.message , "OK");
            // Show the alert
            this.showAlert = true;
          }
          return data;
        }),
        catchError(this.catchHttpError.bind(this))
      );
  }
  catchHttpError(error: HttpErrorResponse) {
    
    const errorResponse = Array.isArray(error.error) ? error.error[0] : error.error;
    console.log(error, error.status, error.statusText)
    if (error.status === 401) {
      
      this.router.navigateByUrl("/sign-in"); // will be handled by auth guard also.
      this.sweetAlerts.prompt("info", "Session expired, Please login again" , "Ok");

      return;
    } else if (
      error.status === 400
    ) {
      this.sweetAlerts.prompt("error", errorResponse.message , "Ok");
    } else if (error.status === 400 &&
      error.headers.get("message")
      ) {
        this.sweetAlerts.prompt("error", error.headers.get("message"), "ok");
    }
    else if (error.status === 429) {
      this.sweetAlerts.prompt(
        "warning",
        "<h6>Sorry! Too many requests, please try again<br><br>" +
        //  time +
          "<br><br>Error code: " +
          error.status +
          "</h6>",
        "OK"
      );
    } else {
      if (!navigator.onLine) { //  If related to no internet connectivity. Will be handled at app.comontnt.ts by showing toast msg.
        return;
      }
      this.sweetAlerts.prompt(
        "warning",
        "<h6>Sorry! An unknown error occurred<br>Please try again.<br> Issue has been noted with our Technical Support team.<br><br></h6>",
        "OK"
      );
    }
    //return throwError("post Catch" + error);
}
  // Get Method
  getMethod<T>(url: string, options?) {

    this.token = sessionStorage.getItem("accessToken");
    const headers = new HttpHeaders()
      .set("Accept", "application/json")
      .set("Content-Type", "application/json;charset=utf-8")
      .set("Access-Control-Allow-Origin", "*")
      .set("Authorization", "Bearer " + this.token);
    return this._httpClient
      .get<T>(url, { headers: headers, ...options })
      .pipe(
        tap((data: any) => {
          return data;
        }), 
        catchError(this.catchHttpError.bind(this))
        );
  }

}
