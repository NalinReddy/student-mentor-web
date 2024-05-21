import { Component, Input, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe, NgClass, NgFor, NgIf, PercentPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { Course } from 'app/models/course.model';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'app/core/user/user.service';
import { BehaviorSubject, Subscription, combineLatest, distinctUntilChanged } from 'rxjs';
import { CourseApiService } from 'app/core/course/courseapi.service';
import { cloneDeep } from 'lodash';
import { Role } from 'app/models/role.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CourseCreateComponent } from '../course-create/course-create.component';
import { University } from 'app/models/university.model';
import { Task, TaskStatus } from 'app/models/task.model';
import { TasksApiService } from 'app/core/tasks/tasksapi.Service';
import { TaskCreateComponent } from '../task-create/task-create.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DiscussionReplies, RepliesStatus, Topic } from 'app/models/topic.model';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { FuseFindByKeyPipe } from '@fuse/pipes/find-by-key';
import { UsersApiService } from 'app/core/users/users.api.service';
import { StudentApiService } from 'app/core/student/studentapi.Service';
import { User } from 'app/models/user.model';
import { Student } from 'app/models/student.model';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TopicLookup, TopicsApiService } from 'app/core/tasks/topicsapi.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateTime } from 'luxon';
import { FuseUtilsService } from '@fuse/services/utils';
import { Term } from 'app/models/term.model';
import { ProfessorApiService } from 'app/core/professor/professorsapi.service';
import { Professor } from 'app/models/professor.model';

@Component({
    selector: 'app-tasks',
    standalone: true,
    imports: [CommonModule, MatTableModule, ReactiveFormsModule, CdkScrollable, MatFormFieldModule, TextFieldModule, MatSelectModule, MatOptionModule, MatIconModule, 
        MatInputModule, MatSlideToggleModule, MatTooltipModule, MatProgressBarModule, MatButtonModule, RouterLink, FuseFindByKeyPipe, PercentPipe,
    MatDatepickerModule, DatePipe, FormsModule],
    templateUrl: './tasks.component.html',
    styleUrls: ['./tasks.component.scss'],
    providers: [CourseApiService, UsersApiService, TasksApiService, StudentApiService, TopicsApiService, ProfessorApiService],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', opacity: '0', display: 'none' })),
            // state('expanded', style({ 'height': 'auto', 'opacity': '1' })),
            state('expanded', style({ height: 'auto', opacity: '1', display: 'block' })),

            transition('collapsed => expanded', [
                // style({ 'display': 'block' }),
                animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)') // animate('300ms ease-in')
            ]),

            transition('expanded => collapsed', [
                animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)') // animate('200ms ease-in')
            ])
        ])
    ]
})
export class TasksComponent implements OnDestroy {
    columns = [
        'firstName',
        'studentId',
        'eduPassword',
        'course',
        'term',
        'week',
        'prof',
        'grades',
        'joiningDate',
        'profComments',
        'profpref',
        // >>>> Discussion & replies count
        'discussion1',
        'replies1',
        'discussion2',
        'replies2',
        // >>>>> Topic1 <<<<<
        'topic1',
        'dueDate1',
        'postedDate1',
        'postedBy1',
        'status1',
        // >>>>> Topic2 <<<<<
        'topic2',
        'dueDate2',
        'postedDate2',
        'postedBy2',
        'status2',
        // >>>>> Topic3 <<<<<
        'topic3',
        'dueDate3',
        'postedDate3',
        'postedBy3',
        'status3',
        // >>>>> Topic4 <<<<<
        'topic4',
        'dueDate4',
        'postedDate4',
        'postedBy4',
        'status4',
        // >>>>> Topic5 <<<<<
        'topic5',
        'dueDate5',
        'postedDate5',
        'postedBy5',
        'status5',
        // >>>> Discussion & replies count
        'discussion3',
        'replies3',
        'discussion4',
        'replies4',
         // >>>>> Topic6 <<<<<
         'topic6',
         'dueDate6',
         'postedDate6',
         'postedBy6',
         'status6',
          // >>>>> Topic7 <<<<<
        'topic7',
        'dueDate7',
        'postedDate7',
        'postedBy7',
        'status7'
    ];
    discussionReplies = DiscussionReplies;
    repliesStatus = RepliesStatus;
    appRoles = Role;

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    isLoggedInUserSuperAdmin: boolean;
    @Input() selectedUniversity: University;
    topicFormGroup: any;
    topics: Topic[];

    categories: any[] = [];
    tasks: Task[] = [];
    filteredTasks: Task[] = [];
    filters: {
        categorySlug$: BehaviorSubject<string>;
        query$: BehaviorSubject<string>;
        hideCompleted$: BehaviorSubject<boolean>;
    } = {
        categorySlug$ : new BehaviorSubject('all'),
        query$        : new BehaviorSubject(''),
        hideCompleted$: new BehaviorSubject(false),
    };
    filterTasksForm: any;
    courses: Course[];
    mentors: User[];
    students: Student[];
    weeks: number[];
    showCreateTask = false;
    taskStatusTypes = TaskStatus;
    queryParams: { assignedMentors: any[]; course: any[]; week: any[]; professor: string};
    selectedCourse: Course;
    topicsLookup: TopicLookup[];
    taskStatusArr = Object.keys(TaskStatus).map(key => ({id: key, name: TaskStatus[key]}));
    membersOfMentors: { [mentorId: string]: User[]; } = {};
    selectedTask: Task;
    membersOfMentorsByTaskId: { [taskId: string]: User[]; } = {};
    professors: Professor[];
    loggedInUser: User;

    constructor(
        private courseApiService: CourseApiService,
        private usersApiService: UsersApiService,
        private studentApiService: StudentApiService,
        private taskApiService: TasksApiService,
        private topicsApiService: TopicsApiService,
        private professorApiService: ProfessorApiService,
        private dialog: MatDialog,
        private userService: UserService,
        private fb: FormBuilder,
        private utils: FuseUtilsService
    ) {
        console.log(this.taskStatusArr);
        // ANyway I think below will be resolved by querying the database based on week selected, as system will auto generate tasks for each student when a bew student is added with the courses and mentors selected
        // ------------------------------------------------------------------------------------------------------------------
        // If current week selected is same/greater than the course actual current week then will display all the tasks lists with all the students assigned to the mentor.
        // When selected a previous week which is less than the curse actual current week then will filter the tasks list in DB for the data which actually created and will not display all the students and tasks.
        // This way we can keep traCk of when a student joined in middle of the semester then all the tasks will be there from that following week but not from previous.
        this.primarySubscripton.add(
            this.taskApiService.tasks.subscribe((data) => {
                this.tasks = cloneDeep(data);
                this.tasks.forEach(task => task.university = this.selectedUniversity);
                this.filteredTasks = cloneDeep(this.tasks);
                this.filteredTasks.forEach(task => {
                    if (!!task.discussions?.length) {
                        if (typeof task.discussions !== "object") {
                            task.discussions = JSON.parse(task.discussions);
                        }
                    } else {
                        task.discussions = {};
                    }
                    if (!!task.repliesStatus?.length) {
                        if (typeof task.repliesStatus !== "object") {
                            task.repliesStatus = JSON.parse(task.repliesStatus);
                        }
                    } else {
                        task.repliesStatus = {};
                    }
                    task.topics = Array.from({length: 7}, (el, i) => {
                        const savedtopic = (task.topics as Topic[]).find((topic: Topic) => topic.order === i+1);
                        if (!!savedtopic?.id) {
                            savedtopic.postedBy = savedtopic.postedBy ? savedtopic.postedBy : "0";
                            savedtopic.topic = savedtopic.topic ? savedtopic.topic : "0";
                            return savedtopic;
                        }
                        const t = new Topic();
                        t.id = "0";
                        t.topic = "0";
                        // Add other selections to mark as none inititally.
                        return t;
                    });
                });
                console.log(this.filteredTasks, "new list retrieved!");
            })
        );

        this.primarySubscripton.add(
            this.taskApiService.topics.subscribe((data) => {
                this.topics = cloneDeep(data);
                this.topics.forEach(topic => topic.university = this.selectedUniversity);
            })
        );

        this.primarySubscripton.add(
            this.usersApiService.members.subscribe((data) => {
                this.membersOfMentors = data;
                if (this.selectedTask) {
                    this.membersOfMentorsByTaskId[this.selectedTask.id] = [];
                    Object.keys(this.membersOfMentors).filter((key: string) => (this.selectedTask.mentorAssigned as string[]).indexOf(key) >= 0 ).forEach(key => {
                        this.membersOfMentorsByTaskId[this.selectedTask.id].push(...data[key]);
                    });
                    console.log(this.membersOfMentorsByTaskId);
                }
                console.log(data);
            })
        );
    }

    getPostedByForMentor(task: Task) {
        this.selectedTask = task;
        console.log(task.mentorAssigned);
        if ( !(task.id in this.membersOfMentorsByTaskId) || !this.membersOfMentorsByTaskId[task.id]?.length) {
            task.mentorAssigned.forEach(mentor => {
                console.log(mentor);
                this.usersApiService.getAllMembers(mentor);
            });
        }
    }

    ngOnDestroy(): void {
        this.primarySubscripton.unsubscribe();
        console.log("trigeref Ondestroy");
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log(changes);
        // if (!changes.selectedUniversity.isFirstChange()) {
            this.queryParams = {assignedMentors: [], course: null, week: null, professor: null};
            this.taskApiService.resetTasks();
            this.init();
        // }
    }

    init() {
        this.professorApiService.getAllprofessors(this.selectedUniversity.id);
        this.topicsApiService.getAllTopicLookups();
        this.courseApiService.getAllcourses(this.selectedUniversity?.id);
        this.usersApiService.getAllUsers(this.selectedUniversity?.id);
    }

    ngOnInit(): void {
        this.queryParams = {assignedMentors: [], course: null, week: null, professor: null};

        this.topicFormGroup = this.fb.group({
            topics: this.fb.array([this.newTopic()])
        });

        // Filter Form
        this.filterTasksForm = this.fb.group(
            {
                searchText: [''],
                professor: [''],
                course: [''],
                week: [1],
                topics: [''],
                mentorAssigned: [''],
                university: [''],
                status: [''],
                active: [true]
            }
        );

        this.primarySubscripton.add(
            this.professorApiService.professors.subscribe((data) => {
                this.professors = cloneDeep(data);
                this.professors.forEach(professor => professor.university = this.selectedUniversity);
            })
        );

        this.primarySubscripton.add(
            this.topicsApiService.topicLookup.subscribe((data) => {
                this.topicsLookup = cloneDeep(data) || [];
                this.topicsLookup.unshift({category: null, name: '--None--', id: '0', active: true, tracking: null});
            })
        );

        this.primarySubscripton.add(
            this.userService.user$.subscribe((user) => {
                this.loggedInUser = user;
                this.isLoggedInUserAdmin = user.role === this.appRoles.Admin;
                this.isLoggedInUserSuperAdmin =
                    user.role === this.appRoles.SuperAdmin;
                    if (!this.isLoggedInUserAdmin && !this.isLoggedInUserSuperAdmin) {
                        this.columns = this.columns.filter(col => col !== "eduPassword");
                    }
            })
        );
        this.primarySubscripton.add(
            combineLatest([this.courseApiService.courses, this.usersApiService.users]).pipe(distinctUntilChanged((prev, current) => {
                return JSON.stringify(prev) === JSON.stringify(current)
            })).subscribe(([courses, users]) => {
                this.mentors = cloneDeep(users);
                console.log("*********************************************calling*************************")
                if (this.mentors?.length) {
                    if (!this.isLoggedInUserAdmin && !this.isLoggedInUserSuperAdmin) {
                        this.filterTasksForm.controls.mentorAssigned.setValue(this.loggedInUser.id, {emitEvent: false});
                        this.filterTasksForm.controls.mentorAssigned.disable();
                    } else {
                        this.filterTasksForm.controls.mentorAssigned.setValue(this.mentors[0].id, {emitEvent: false});
                    }
                    this.queryParams['assignedMentors'] = [this.filterTasksForm.controls.mentorAssigned.value];
                }
                this.courses = cloneDeep(courses);
                if (this.courses?.length) {
                    this.filterTasksForm.controls.course.setValue(this.courses[0].id, {emitEvent: false});
                    this.listWeeks(this.courses[0].id);
                }
            })
        );
       

        this.primarySubscripton.add(
            this.studentApiService.students.subscribe((data) => {
                this.students = cloneDeep(data);
            })
        );

        this.filterTasksForm.controls.mentorAssigned.valueChanges.subscribe(mentorId => {
            this.queryParams['assignedMentors'] = [mentorId];
        });
        this.filterTasksForm.controls.course.valueChanges.subscribe(courseId => {
            this.listWeeks(courseId);
        });

        this.primarySubscripton.add(this.filterTasksForm.controls.week.valueChanges.subscribe(v => this.queryParams.week = v));

        this.primarySubscripton.add(this.filterTasksForm.valueChanges.subscribe(d => {
            this.queryParams.professor = d.professor;
            if (this.queryParams.course && this.queryParams.week) {
                this.filterOnFormChange();
            }
       }));

    //    this.taskApiService.getAllTasks(this.selectedUniversity?.id, this.queryParams);
    }

    listWeeks(courseId) {
        this.queryParams['course'] = courseId;
        this.selectedCourse = this.courses.find(course => course.id === courseId);
        const course = this.courses.find(_c => _c.id === courseId);
        this.weeks = Array.from({ length: course.termPeriod.endWeek - course.termPeriod.startWeek + 1 }, (_, index) => course.termPeriod.startWeek + index);
        let currentWeek = course.term ? this.utils.getCurrentWeek((course.term as Term).startDate) : this.weeks[0];
        currentWeek = currentWeek >= course.termPeriod.startWeek && currentWeek <= course.termPeriod.endWeek ? currentWeek : 1;
        this.filterTasksForm.controls.week.setValue(currentWeek);
        console.log(this.weeks, this.filterTasksForm.value);
    }

    onWeekFilterChange(weekSelected) {
        // Will query the DB based on selected week and returns the datasets.

    }

    onTaskFieldsChange(task:Task) {
        console.log(task, "values changes");
        const taskForm = this.createTaskForm(task);
        if (typeof taskForm.value.discussions === "object") {
            taskForm.value.discussions = JSON.stringify(taskForm.value.discussions);
        }
        if (typeof taskForm.value.repliesStatus === "object") {
            taskForm.value.repliesStatus = JSON.stringify(taskForm.value.repliesStatus);
        }
            this.taskApiService.updateTask(taskForm.value as Task, task.id).subscribe(updatedTask => {
                console.log("updated updatedTask", updatedTask);
            });
    }

    onTopicChange({value}, task: Task, order: number) {
        
        const selectedTopic = (task.topics as Topic[]).find((topic: Topic) => topic.order === order) as Topic;

        if (!!selectedTopic && selectedTopic.id !== "0") {
            const topicForm = this.createTopicForm(selectedTopic);
            this.topicsApiService.updateTopic(topicForm.value as Topic, selectedTopic.id).subscribe(updatedTopic => {
                console.log("updated updatedTopic", updatedTopic);
            });

        } else {
            const selectedTopic = (task.topics as Topic[])[order-1] as Topic;
            const data = {
                studentId: task.student?.studentId,
                student: task.student.id,
                course: task.course.id,
                week: this.filterTasksForm.value.week,
                mentorAssigned: task.mentorAssigned,
                university: (task.university as University).id,
                status: TaskStatus.NOT_STARTED,
                task: task.id,
                topic: value,
                order,
                postedDate: selectedTopic.postedDate,
                postedBy: selectedTopic.postedBy,
            };
            const topicForm = this.createTopicForm(data);
            this.topicsApiService.createTopic(topicForm.value as Topic)
            .subscribe(topicCreated => {
                task.topics = task.topics || [];
                task.topics.push(topicCreated);
            });
        }
    }

    updateFieldValueOfTopicOnChange(task: Task, order: number) {
        const selectedTopic = (task.topics as Topic[]).find((topic: Topic) => topic.order === order) as Topic;

        if (!!selectedTopic && selectedTopic.id !== "0") {
            setTimeout(() => {
                const topicForm = this.createTopicForm(selectedTopic);
                console.log(topicForm.value, selectedTopic);
                this.topicsApiService.updateTopic(topicForm.value as Topic, selectedTopic.id).subscribe(updatedTopic => {
                    console.log("updated updatedTopic", updatedTopic);
                });
    
            }, 0);
           
        }
    }

    onDueDateChange(value, task: Task, order: number) {
        // If topic in DB is created...
        const selectedTopic = (task.topics as Topic[])[order-1] as Topic;
        selectedTopic.dueDate = value;

        if (!!selectedTopic && selectedTopic?.id !== '0') {
            // const data = {
            //     studentId: selectedTopic.studentId,
            //     student: selectedTopic.student,
            //     course: selectedTopic.course,
            //     week: selectedTopic.week,
            //     mentorAssigned: selectedTopic.mentorAssigned,
            //     university: selectedTopic.university,
            //     status: selectedTopic.status,
            //     dueDate: value,
            //     postedDate: selectedTopic.postedDate,
            //     postedBy: selectedTopic.postedBy,
            //     task: selectedTopic.task,
            //     topic: selectedTopic.topic,
            //     order
            // };
            const topicForm = this.createTopicForm(selectedTopic);
            this.topicsApiService.updateTopic(topicForm.value as Topic, selectedTopic.id).subscribe(updatedTopic => {
                console.log("updated updatedTopic", updatedTopic);
            });
        }
    }

    createTopicForm(data: any) {
        console.log("postedby", data.postedBy);
        return this.fb.group(
            {
                title: [data.title],
                studentId: [data.studentId, Validators.required],
                student: [data.student, Validators.required],
                course: [data.course, Validators.required],
                week: [data.week, Validators.required],
                mentorAssigned: [data.mentorAssigned, Validators.required],
                university: [data.university, Validators.required],
                status: [data.status, Validators.required], // Assuming NotStarted is the default status
                dueDate  : [data.dueDate],
                postedDate: [data.postedDate],
                postedBy: [data.postedBy === "0" ? null : data.postedBy],
                priority : [0],
                tags     : [[]],
                active: [true, Validators.required],
                task: [data.task],
                topic: [data.topic === "0" ? null : data.topic],
                order: [data.order]
            }
        );
    }

    createTaskForm(data: any) {
        return this.fb.group(
            {
                title: [data.title],
                studentId: [data.studentId, Validators.required],
                student: [data.student?.id, Validators.required],
                course: [data.course?.id, Validators.required],
                grade: [data.grade],
                week: [data.week],
                joiningDate: [data.joiningDate],
                profComments: [data.profComments],
                profPref: [data.profPref],
                discussions: [data.discussions],
                repliesStatus: [data.repliesStatus],
                topics: [data.topics.filter(topic => topic.id !== "0" ).map(topic => topic.id)], // Form array for topics],
                mentorAssigned: [data.mentorAssigned, Validators.required],
                postedBy: [data.postedBy],
                postedDate: [data.postedDate],
                university: [data.university?.id, Validators.required],
                status: [data.status, Validators.required], // Assuming NotStarted is the default status
                dueDate  : [data.dueDate],
                priority : [0],
                tags     : [[]],
                active: [true, Validators.required]
            }
        );
    }


    // submitTask(id: string): Observable<any> {
    //     console.log(this.createTaskForm)
    //     if (this.createTaskForm.invalid) {
    //         console.info('component.submit form invalid');
    //         return;
    //     }
    //     if (id) {
    //         return this.taskApiService.updateTask(this.createTaskForm.value, id);
    //     }
    //     return this.taskApiService.createTask(this.createTaskForm.value);
    // }

    // submitTopic(id: string): Observable<any> {
    //     console.log(this.createTopicForm)
    //     if (this.createTopicForm.invalid) {
    //         console.info('component.submit form invalid');
    //         return;
    //     }
    //     if (id) {
    //         return this.topicsApiService.updateTopic(this.createTopicForm.value, id).pipe(tap(d => this.taskApiService.getAllTasks(this._task.university, '')));
    //     }
    //     return this.topicsApiService.createTopic(this.createTopicForm.value);
    // }



    /**
     * Check if the task is overdue or not
     */
    isOverdue(task): boolean
    {
        if (!task.dueDate) return;
        if (task.status === this.taskStatusTypes.COMPLETED) return false;
        return DateTime.fromISO(task.dueDate).startOf('day') < DateTime.now().startOf('day');
    }

    filterOnFormChange() {
        this.taskApiService.getAllTasks(this.selectedUniversity.id, this.queryParams);
    }

    /**
     * Filter by search query
     *
     * @param query
     */
    filterByQuery(query: string): void
    {
        this.filters.query$.next(query);
    }

    /**
     * Filter by category
     *
     * @param change
     */
    filterByCategory(change: MatSelectChange): void
    {
        this.filters.categorySlug$.next(change.value);
    }

    /**
     * Show/hide completed courses
     *
     * @param change
     */
    toggleCompleted(change: MatSlideToggleChange): void
    {
        this.filters.hideCompleted$.next(change.checked);
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    newTopic() {
        return {
            topic: ['', [Validators.required]],
            dueDate: ['', [Validators.required]],
            assignedMentor: ['', [Validators.required]],
            university: [this.selectedUniversity.id, [Validators.required]],
            student: ['', [Validators.required]],
            course: ['', [Validators.required]],
            task: ['', [Validators.required]],
            discussion: ['', [Validators.required]],
            reply: ['', [Validators.required]],
            status: ['', [Validators.required]]
        }
    }

    // Method to add more topics dynamically
    addTopic() {
        const topics = this.topicFormGroup.get('topics') as FormArray;
        topics.push(this.fb.group({
            ...this.newTopic()
        }));
    }

    toggleTableRows(singleRow?: Task) {
        console.info(`OpenOrdersComponent.toggleTableRows`);
        singleRow.isExpanded = !singleRow.isExpanded;
        if (singleRow.isExpanded) {
            singleRow.previewIcon = 'expand_more';
        } else {
            singleRow.previewIcon = 'chevron_right';
        }
    }

    createTask() {
      const newTask = new Task();
      newTask.university = this.selectedUniversity.id;
      newTask.status = TaskStatus.NOT_STARTED;
      const dialogRef = this.dialog.open(TaskCreateComponent, {
          width: '500px',
          height: '100%',
          restoreFocus: false,
          position: {
              top: '0',
              right: '0',
              bottom: '0'
          },
          data: newTask
      });
      this.primarySubscripton.add(
          dialogRef.afterClosed().subscribe((data) => {
              if (data?.success) {
                this.taskApiService.getAllTasks(this.selectedUniversity.id, JSON.stringify(this.filterTasksForm.value));
              }
          })
      );
  }
}
