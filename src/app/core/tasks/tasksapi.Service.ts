import { Injectable } from '@angular/core';
import { TrackingService } from '@fuse/services/tracking.service';
import { environment } from 'environments/environment';
import { tap, map, BehaviorSubject, Observable } from 'rxjs';
import { DatafactoryService } from '../datafactory.service';
import { SweetAlertService } from '@fuse/services/sweet-alerts/sweet-alerts.service';
import { Task } from 'app/models/task.model';
import { Topic } from 'app/models/topic.model';

@Injectable({providedIn: 'root'})
export class TasksApiService
{
    private _tasks: BehaviorSubject<Task[]> = new BehaviorSubject<Task[]>([]);
    private _tasksForReport: BehaviorSubject<Task[]> = new BehaviorSubject<Task[]>([]);
    private _task: BehaviorSubject<Task | null> = new BehaviorSubject(null);
    private _topics: BehaviorSubject<Topic[]> = new BehaviorSubject<Topic[]>([]);
    private dataStore = {
        tasks: [],
        tasksForReport: [],
        newTask: new Task(),
        topics: []
    }
    constructor(private dataFactory: DatafactoryService, private trackingService: TrackingService, private alertService: SweetAlertService) {
        
    }

    /**
     * Returns an observable list of _Tasks. Accessible by administrative components only.
     */
    get tasks(): Observable<Task[]> {
        return this._tasks.asObservable();
    }

     /**
     * Returns an observable list of _Tasks. Accessible by administrative components only.
     */
     get tasksForReport(): Observable<Task[]> {
        return this._tasksForReport.asObservable();
    }

    /**
     * Getter for task
     */
    get task$(): Observable<Task>
    {
        return this._task.asObservable();
    }

    /**
     * Returns an observable list of _Topics. Accessible by administrative components only.
     */
    get topics(): Observable<Topic[]> {
        return this._topics.asObservable();
    }

    getAllTasks(university, q: any) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`TasksApiService.getAllTasks`);
        let query = "?";
        if (q?.assignedMentors) {
            query += "assignedMentors="+q.assignedMentors+"&";
        }
        if (q?.course) {
            query += "course="+q.course+"&";
        }
        if (q?.week) {
            query += "week="+q.week+"&";
        }
        if (q?.term) {
            query += "term="+q.term+"&";
        }
        if (q?.professor) {
            query += "professor="+q.professor+"&";
        }
        this.dataFactory.postMethod(`${environment.apiUrl}/Tasks/getAllTasks${query}`, {university}).subscribe(
            (data) => {
                this.dataStore.tasks = data;
                this._tasks.next(Object.assign({}, this.dataStore).tasks);
            },
            (error) => {
                console.error(`Failed to retrieve Tasks. ${error}`);
            }
        );
    }

    resetTasks() {
        this.dataStore.tasks = [];
        this.dataStore.tasksForReport = [];
        this._tasks.next([]);
        this._tasksForReport.next([]);
    }

    getAllTasksForHandlerAllocation(university, q: any) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`TasksApiService.getAllTasksForHandlerAllocation`);
        let query = "?";
        if (q?.assignedMentors) {
            query += "assignedMentors="+q.assignedMentors+"&";
        }
        if (q?.course) {
            query += "course="+q.course+"&";
        }
        if (q?.week) {
            query += "week="+q.week+"&";
        }
        if (q?.term) {
            query += "term="+q.term+"&";
        }
        this.dataFactory.postMethod(`${environment.apiUrl}/Tasks/getAllTasksForHandlerAllocation${query}`, {university}).subscribe(
            (data) => {
                this.dataStore.tasksForReport = data;
                this._tasksForReport.next(Object.assign({}, this.dataStore).tasksForReport);
            },
            (error) => {
                console.error(`Failed to retrieve Tasks. ${error}`);
            }
        );
    }
    
    getAllTasksForStudentTracker(university, course, term, studentId, q?) {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        let query = "?";
        console.log(`TasksApiService.getAllTasksForStudentTracker`);
        if (q?.week) {
            query += "week="+q.week+"&";
        }
        if (q?.status) {
            query += "status="+q.status+"&";
        }
        this.dataFactory.postMethod(`${environment.apiUrl}/Tasks/getAllTasksForStudentTracker${query}`, {params: {university, course, term, studentId}}).subscribe(
            (data) => {
                this.dataStore.tasksForReport = data;
                this._tasksForReport.next(Object.assign({}, this.dataStore).tasksForReport);
            },
            (error) => {
                console.error(`Failed to retrieve Tasks. ${error}`);
            }
        );
    }

    
    _createNewTask(type: 'section' | 'task') {
        const task = new Task();
        task.type = type;
        this.dataStore.newTask = task;
        console.log(this.dataStore);
        this._task.next(this.dataStore.newTask);
    }

    _createNewTaskPublish(task: Task) {
        this.dataStore.newTask = task;
        console.log(this.dataStore);
        this._task.next(this.dataStore.newTask);
    }

    createTask(Task: Task) {
        console.info(`TasksApiService.createTask`);

            this.trackingService.createTracking(Task);
            return this.dataFactory.postMethod(`${environment.apiUrl}/Tasks/`, Task).pipe(
                map((result) => {
                    // this.getAllTasks();
                    this.alertService.showToast("success" ,'Task added successfully!', 3600);
                    return result;
                })
            );
    }

    updateTask(Task: Task, id: string) {
        console.info(`TasksApiService.updateTask`);
        if (Task.topics?.length && typeof(Task.topics[0]) === "object") {
            Task.topics = Task.topics.map((topic: any) => topic.id);
        }

            this.trackingService.createTracking(Task);
            return this.dataFactory.putMethod(`${environment.apiUrl}/Tasks/${id}`, Task).pipe(
                map((result) => {
                    // this.getAllTasks(Task.university, '');
                    this.alertService.showToast("success" ,'Task updated successfully!', 3600);
                    return result;
                })
            );
    }

    getAllTopics() {

        // should create a datafactory methods so that can handle 401 and other errors globally.
        console.log(`TasksApiService.getAllTasks`);
        this.dataFactory.getMethod(`${environment.apiUrl}/Tasks/getAllTasks`).subscribe(
            (data) => {
                this.dataStore.topics = data;
                this._topics.next(Object.assign({}, this.dataStore).topics);
            },
            (error) => {
                console.error(`Failed to retrieve Tasks. ${error}`);
            }
        );
    }

    createTopic(topic: Topic) {
        console.info(`TasksApiService.createTask`);

            this.trackingService.createTracking(topic);
            return this.dataFactory.postMethod(`${environment.apiUrl}/Tasks/`, topic).pipe(
                map((result) => {
                    // this.getAllTasks();
                    this.alertService.showToast("success" ,'Task added successfully', 3600);
                    return result;
                })
            );
    }
}