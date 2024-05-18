import { Injectable } from "@angular/core";
import { UserService } from "app/core/user/user.service";
import { Tracking, UserTracking } from "app/models/tracking.model";
import { Subscription } from "rxjs";
import { User } from "app/models/user.model";


@Injectable({
    providedIn: 'root'
})
export class TrackingService {
    subscription = new Subscription();
    constructor(private userService: UserService) {
        console.info(`TrackingService.constructor`);
    }

    createTracking(data: any) {
        try {
            this.subscription.add(this.userService.user$.subscribe(user => {
                if (user && data) {
                if (!data.tracking) {
                    data.tracking = new Tracking();
                }
                (data.tracking as Tracking).createdDate = new Date().toISOString();
                (data.tracking as Tracking).createdBy = user.firstName + ' ' + user.lastName;
                (data.tracking as Tracking).createdBySourceId = "WEB";

                console.info(`TrackingService.createTracking: ${JSON.stringify(data)}`);
            } 
            }));
        } catch (err) {
            console.error(`TrackingService.createTracking error ${JSON.stringify(err)}`);
        }
        return data;
    }

    createUserTracking(data: User) {
        try {
            this.subscription.add(this.userService.user$.subscribe(user => {
                if (user && data) {
                    if (!data.tracking) {
                        data.tracking = new UserTracking();
                    }
                    (data.tracking as UserTracking).createdDate = new Date().toISOString();
                    (data.tracking as UserTracking).createdBy = user.firstName + ' ' + user.lastName;
                    (data.tracking as UserTracking).createdBySourceId = "WEB";
    
                    console.info(`TrackingService.createUserTracking: ${JSON.stringify(data)}`);
                }
            }));
            
        } catch (err) {
            console.error(`TrackingService.createTracking error ${JSON.stringify(err)}`);
        }
        return data;
    }

    updateTracking(data: any) {
        console.info(`TrackingService.updateTracking`);
        try {
            this.subscription.add(this.userService.user$.subscribe(user => {
                if (user && data && data.tracking) {
                    (data.tracking as Tracking).lastUpdatedDate = new Date().toISOString();
                    (data.tracking as Tracking).lastUpdatedBy = user.firstName + ' ' + user.lastName;
                    (data.tracking as Tracking).lastUpdatedSourceId = "WEB";
                }

            }));
            
        } catch (err) {
            console.error(`TrackingService.updateTracking error updating tracking data ${JSON.stringify(err)}`);
        }
        return data;
    }
}
