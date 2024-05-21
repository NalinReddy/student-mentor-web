import { Injectable } from '@angular/core';
import { TrackingService } from '@fuse/services/tracking.service';
import { environment } from 'environments/environment';
import { tap, map, BehaviorSubject, Observable } from 'rxjs';
import { DatafactoryService } from '../datafactory.service';
import { SweetAlertService } from '@fuse/services/sweet-alerts/sweet-alerts.service';
import { Topic } from 'app/models/topic.model';

export class TopicLookup {
    category: string | {[key: string]: any}; name: string; active: boolean; tracking: any
    id: any;
} 

@Injectable({providedIn: 'root'})
export class TopicsApiService
{
    private _topics: BehaviorSubject<Topic[]> = new BehaviorSubject<Topic[]>([]);
    private _topicsLookup: BehaviorSubject<TopicLookup[]> = new BehaviorSubject<TopicLookup[]>([]);
    private dataStore = {
        topics: [],
        topicLookup: []
    }
    constructor(private dataFactory: DatafactoryService, private trackingService: TrackingService, private alertService: SweetAlertService) {
        
    }
    /**
     * Returns an observable list of _Topics. Accessible by administrative components only.
     */
    get topics(): Observable<Topic[]> {
        return this._topics.asObservable();
    }

     /**
     * Returns an observable list of _Topics. Accessible by administrative components only.
     */
     get topicLookup(): Observable<TopicLookup[]> {
        return this._topicsLookup.asObservable();
    }

    updateTopic(Topic: Topic, id: string) {
        console.info(`TasksApiService.updateTopic`);

            this.trackingService.createTracking(Topic);
            return this.dataFactory.putMethod(`${environment.apiUrl}/Topics/${id}`, Topic).pipe(
                map((result) => {
                    // this.getAllTopics();
                    this.alertService.showToast("success" ,'Topic updated successfully!', 3600);
                    return result;
                })
            );
    }

    getAllTopics() {
        console.log(`TasksApiService.getAllTopics`);
        this.dataFactory.getMethod(`${environment.apiUrl}/Topics/`).subscribe(
            (data) => {
                this.dataStore.topics = data;
                this._topics.next(Object.assign({}, this.dataStore).topics);
            },
            (error) => {
                console.error(`Failed to retrieve Topics. ${error}`);
            }
        );
    }

    createTopic(topic: Topic) {
        console.info(`TasksApiService.createTopic`);

            this.trackingService.createTracking(topic);
            return this.dataFactory.postMethod(`${environment.apiUrl}/Topics/`, topic).pipe(
                map((result) => {
                    // this.getAllTasks();
                    this.alertService.showToast("success" ,'Topic added successfully', 3600);
                    return result;
                })
            );
    }

    updateTopicLookup(TopicLookup: TopicLookup, id: string) {
        console.info(`TasksApiService.updateTopic`);

            this.trackingService.createTracking(TopicLookup);
            return this.dataFactory.putMethod(`${environment.apiUrl}/Topics/lookup/${id}`, TopicLookup).pipe(
                map((result) => {
                    this.getAllTopicLookups();
                    this.alertService.showToast("success" ,'Topic updated successfully!', 3600);
                    return result;
                })
            );
    }

    getTopicCategories() {
        console.log(`TasksApiService.getTopicCategories`);
        return this.dataFactory.getMethod(`${environment.apiUrl}/Topics/categories`);
    }

    getHandlerTopicStatus(query: {university: string, category: string, week: number}) {
        console.log(`TasksApiService.getHandlerTopicStatus`);
        const queryData = `university=${query.university}&category=${query.category}&week=${query.week}`;
        return this.dataFactory.getMethod(`${environment.apiUrl}/Topics/getHandlerTopicStatus?${queryData}`);
    }

    getAllTopicLookups() {
        console.log(`TasksApiService.getAllTopicLookups`);
        this.dataFactory.getMethod(`${environment.apiUrl}/Topics/lookup/getAll`).subscribe(
            (data) => {
                this.dataStore.topicLookup = data;
                this._topicsLookup.next(Object.assign({}, this.dataStore).topicLookup);
            },
            (error) => {
                console.error(`Failed to retrieve Topics. ${error}`);
            }
        );
    }

    createTopicLookup(topic: TopicLookup) {
        console.info(`TasksApiService.createTopicLookup`);

            this.trackingService.createTracking(topic);
            return this.dataFactory.postMethod(`${environment.apiUrl}/Topics/lookup`, topic).pipe(
                map((result) => {
                    // this.getAllTasks();
                    this.alertService.showToast("success" ,'Topic added successfully', 3600);
                    return result;
                })
            );
    }
}