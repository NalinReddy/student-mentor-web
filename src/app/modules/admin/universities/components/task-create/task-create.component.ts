import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { Observable, Subscription, map, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SelectErrorStateMatcher } from '@fuse/directives/error-state-matcher';
import { Role } from 'app/models/role.model';
import { Title } from 'app/models/title.model';
import { UserService } from 'app/core/user/user.service';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { University } from 'app/models/university.model';
import { UniversityApiService } from 'app/core/university/universityapi.service';
import { Course, CourseType } from 'app/models/course.model';
import { CourseApiService } from 'app/core/course/courseapi.service';
import { Task, TaskStatus } from 'app/models/task.model';
import { cloneDeep } from 'lodash';
import { UsersApiService } from 'app/core/users/users.api.service';
import { User } from 'app/models/user.model';
import { StudentApiService } from 'app/core/student/studentapi.Service';
import { Student } from 'app/models/student.model';
import { TasksApiService } from 'app/core/tasks/tasksapi.Service';
import { Topic } from 'app/models/topic.model';
import { TopicLookup, TopicsApiService } from 'app/core/tasks/topicsapi.service';


@Component({
    selector: 'app-task-create',
    templateUrl: './task-create.component.html',
    styleUrls: ['./task-create.component.scss'],
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatIconModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule]
})
export class TaskCreateComponent implements OnInit, OnDestroy {
    createTaskForm: FormGroup;
    matcher = new SelectErrorStateMatcher();

    roles: string[] = Object.values(Role).sort();
    titles: string[] = Object.values(Title).sort();
    _task: Task = new Task();
    courseTypes = [];
    CourseTypeEnum = CourseType;

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    appRoles = Role;
    inputData: any;
    students: Student[] = [];
    professors: any[] = [];
    selectedTermType: CourseType;
    availableWeeks: any[];
    courses: Course[] = [];
    mentors: User[] = [];
    weeks = [];
    createTopicForm: any;
    topics: TopicLookup[] = [];

    constructor(
        // private dialogRef: MatDialogRef<TaskCreateComponent>,
        protected formBuilder: FormBuilder,
        protected courseApiService: CourseApiService,
        protected usersApiService: UsersApiService,
        protected studentApiService: StudentApiService,
        protected taskApiService: TasksApiService,
        protected topicsApiService: TopicsApiService,
        protected userService: UserService,
        // @Inject(MAT_DIALOG_DATA) data
    ) {
        // this.inputData = data;
        this._task = this.inputData;
        this.courseTypes = Object.values(CourseType);
    }

    ngOnDestroy(): void {
        console.info(`CourseCreateComponent.ngOnDestroy`);
        this.primarySubscripton.unsubscribe();
    }

    ngOnInit(): void {
        this.primarySubscripton.add(
            this.userService.user$.subscribe(user => {
                this.isLoggedInUserAdmin = user.role === this.appRoles.Admin;
            })
        );
        this.primarySubscripton.add(
            this.courseApiService.courses.subscribe((data) => {
                this.courses = cloneDeep(data);
            })
        );
        this.courseApiService.getAllcourses(this._task?.university);

        this.primarySubscripton.add(
            this.topicsApiService.topicLookup.subscribe((data) => {
                this.topics = cloneDeep(data);
            })
        );
        this.topicsApiService.getAllTopicLookups();

        this.primarySubscripton.add(
            this.usersApiService.users.subscribe((data) => {
                this.mentors = cloneDeep(data);
            })
        );
        this.usersApiService.getAllUsers(this._task?.university);

        this.primarySubscripton.add(
            this.studentApiService.students.subscribe((data) => {
                this.students = cloneDeep(data);
            })
        );
        this.studentApiService.getAllStudents(this._task?.university);

        this.initializeFormValues();
        
    }

    /** min lenght and same as controls */
    initializeFormValues() {
        this.createTaskForm = this.formBuilder.group(
            {
                title: [this._task.title],
                studentId: [this._task.studentId, Validators.required],
                student: [this._task.student, Validators.required],
                course: [this._task.course, Validators.required],
                week: [this._task.week, Validators.required],
                topics: [this.formBuilder.array([])], // Form array for topics],
                mentorAssigned: [this._task.mentorAssigned, Validators.required],
                university: [this._task.university, Validators.required],
                status: [this._task.status, Validators.required], // Assuming NotStarted is the default status
                dueDate  : [null],
                priority : [0],
                tags     : [[]],
                active: [true, Validators.required]
            }
        );

        this.createTopicForm = this.formBuilder.group(
            {
                title: [this._task.title],
                studentId: [this._task.studentId, Validators.required],
                student: [this._task.student, Validators.required],
                course: [this._task.course, Validators.required],
                week: [this._task.week, Validators.required],
                mentorAssigned: [this._task.mentorAssigned, Validators.required],
                university: [this._task.university, Validators.required],
                status: [this._task.status, Validators.required], // Assuming NotStarted is the default status
                dueDate  : [null],
                priority : [0],
                tags     : [[]],
                active: [true, Validators.required],
                // extra props for topic
                task: [this._task.id],
                topic: [],
                discussion: [],
                reply: [],
                order: []
            }
        );
    }

    patchFormAndSave(taskData: Task | Topic) {
        if ('topic' in taskData) {
            this.createTopicForm.patchValue({
                title: taskData.title,
                studentId: taskData.studentId,
                student: taskData.student,
                course: taskData.course,
                week: taskData.week,
                mentorAssigned: taskData.mentorAssigned,
                university: taskData.university,
                status: taskData.status,
                dueDate: taskData.dueDate,
                priority: taskData.priority,
                tags: taskData.tags,
                topic: taskData.topic,
                discussion: taskData.discussion,
                reply: taskData.reply,
                task: taskData.task,
                order: taskData.order
            });
        } else {
            this.createTaskForm.patchValue({
                title: taskData.title,
                studentId: taskData.studentId,
                student: taskData.student,
                course: taskData.course,
                week: taskData.week,
                topics: taskData.topics,
                mentorAssigned: taskData.mentorAssigned,
                university: taskData.university,
                status: taskData.status,
                dueDate: taskData.dueDate,
                priority: taskData.priority,
                tags: taskData.tags
            });
        }
        
        return 'topic' in taskData ? this.submitTopic(taskData.id) : this.submitTask(taskData.id);
    }

    get f() {
        return this.createTaskForm.controls;
    }

    onTermTypeChange(termType: CourseType) {
        this.selectedTermType = termType;
        this.updateAvailableWeeks();
      }
    
      updateAvailableWeeks() {
        this.availableWeeks = [];
        const maxWeeks = this.selectedTermType === CourseType.FullTerm ? 53 : 26; // Adjust as needed for half terms
        for (let i = 1; i <= maxWeeks; i++) {
          this.availableWeeks.push(i);
        }
      }

    submitTask(id: string): Observable<any> {
        console.log(this.createTaskForm)
        if (this.createTaskForm.invalid) {
            console.info('component.submit form invalid');
            return;
        }
        if (id) {
            return this.taskApiService.updateTask(this.createTaskForm.value, id);
        }
        return this.taskApiService.createTask(this.createTaskForm.value);
    }

    submitTopic(id: string): Observable<any> {
        console.log(this.createTopicForm)
        if (this.createTopicForm.invalid) {
            console.info('component.submit form invalid');
            return;
        }
        if (id) {
            return this.topicsApiService.updateTopic(this.createTopicForm.value, id).pipe(tap(d => this.taskApiService.getAllTasks(this._task.university, '')));
        }
        return this.topicsApiService.createTopic(this.createTopicForm.value);
    }

    dismiss(): void {
        // this.dialogRef.close(null);
    }
}
