export class Tracking {
    createdDate: string;
    createdBy: string;
    createdBySourceId: string;
    lastUpdatedDate: string;
    lastUpdatedBy: string;
    lastUpdatedSourceId: string;
}

export class UserTracking extends Tracking {
    lastLoginIpAddress: string;
    lastLoginLocation?: any;
    lastLoginDate: string;
}
