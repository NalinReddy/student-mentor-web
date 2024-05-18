import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { FuseFindByKeyPipe } from '@fuse/pipes/find-by-key/find-by-key.pipe';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { assign, cloneDeep } from 'lodash-es';
import { DateTime } from 'luxon';
import { debounceTime, filter, pipe, Subject, takeUntil, tap } from 'rxjs';
import { Tag, Task } from '../tasks.types';
import { TasksListComponent } from '../list/list.component';
import { TasksService } from '../tasks.service';
import { TaskCreateComponent } from 'app/modules/admin/universities/components/task-create/task-create.component';
import { CourseApiService } from 'app/core/course/courseapi.service';
import { StudentApiService } from 'app/core/student/studentapi.Service';
import { UserService } from 'app/core/user/user.service';
import { UsersApiService } from 'app/core/users/users.api.service';
import { MatSelectModule } from '@angular/material/select';
import { TaskStatus } from 'app/models/task.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TasksApiService } from 'app/core/tasks/tasksapi.Service';
import { TopicsApiService } from 'app/core/tasks/topicsapi.service';
import { DiscussionReplies, RepliesStatus } from 'app/models/topic.model';

@Component({
    selector       : 'tasks-details',
    templateUrl    : './details.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [FormsModule, ReactiveFormsModule, MatTooltipModule, MatButtonModule, NgIf, MatIconModule, MatMenuModule, RouterLink, MatDividerModule, MatFormFieldModule, MatInputModule, TextFieldModule, NgFor, MatRippleModule, MatCheckboxModule, NgClass, MatDatepickerModule, FuseFindByKeyPipe, DatePipe, MatSelectModule],
})
export class TasksDetailsComponent extends TaskCreateComponent implements OnInit, AfterViewInit, OnDestroy
{
    @ViewChild('tagsPanelOrigin') private _tagsPanelOrigin: ElementRef;
    @ViewChild('tagsPanel') private _tagsPanel: TemplateRef<any>;
    @ViewChild('titleField') private _titleField: ElementRef;

    tags: Tag[];
    tagsEditMode: boolean = false;
    filteredTags: Tag[];
    task: Task;
    taskForm: UntypedFormGroup;
    tasks: Task[] = [];
    private _tagsPanelOverlayRef: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @Input('_DBTask') _task;
    @Input("selectedTask") selectedTask;
    discussionReplies = DiscussionReplies;
    repliesStatus = RepliesStatus;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _renderer2: Renderer2,
        private _router: Router,
        private _tasksListComponent: TasksListComponent,
        private _tasksService: TasksService,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
        protected formBuilder: FormBuilder,
        protected courseApiService: CourseApiService,
        protected usersApiService: UsersApiService,
        protected studentApiService: StudentApiService,
        protected taskApiService: TasksApiService,
        protected topicsApiService: TopicsApiService,
        protected userService: UserService,
    )
    {
        super(formBuilder, courseApiService, usersApiService, studentApiService, taskApiService, topicsApiService, userService);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Open the drawer
        // this._tasksListComponent.matDrawer.open();

        super.ngOnInit();


        // Create the task form
        this.taskForm = this._formBuilder.group({
            id       : [this._task.id],
            type     : [this._task.type],
            title    : [this._task.title],
            notes    : [this._task.notes],
            completed: [this._task.completed],
            dueDate  : [this._task.dueDate],
            priority : [this._task.priority],
            tags     : [ this._task.tags || []],
            order    : [this._task.order || 0],
            university: [this._task.university || null],
            course: [this._task.course],
            studentId: [this._task.studentId],
            student: [this._task.student],
            week: [this._task.week],
            mentorAssigned: [this._task.mentorAssigned],
            topic: [this._task.topic],
            discussion: [this._task.discussion],
            reply: [this._task.reply]
        });
        
        this.taskForm.controls.course.valueChanges.subscribe(courseId => {
            const course = this.courses.find(_c => _c.id === courseId);
            this.weeks = Array.from({ length: course.termPeriod.endWeek - course.termPeriod.startWeek + 1 }, (_, index) => course.termPeriod.startWeek + index);
        });
        this.taskForm.controls.student.valueChanges.subscribe(id => {
            const student = this.students.find(student => student.id === id);
            if (student) {
                this.taskForm.controls.studentId.setValue(student.studentId);
            }
        });
        this.taskForm.controls.topic.valueChanges.subscribe(id => {
            const topic = this.topics.find(topic => topic.id === id);
            if (topic) {
                this.taskForm.controls.title.setValue(topic.name);
            }
        });

        if (this._task.course) { // When edit mode
            this.courseApiService.courses.subscribe((data) => { // To MakeSure api response is done for below.
                this.taskForm.controls.course.setValue(this._task.course); // to trigger valuechange listeners. 
            });
        }

        // Get the tags
        this._tasksService.tags$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tags: Tag[]) =>
            {
                this.tags = tags;
                this.filteredTags = tags;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the tasks
        this._tasksService.tasks$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tasks: Task[]) =>
            {
                this.tasks = tasks || [];
                console.log("tasks list", this.tasks, tasks);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the task
        this._tasksService.task$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((task: Task) =>
            {
                if (!task) return;
                // Open the drawer in case it is closed
                this._tasksListComponent.matDrawer.open();

                // Get the task
                this.task = task;
                console.log(this.task, this.tasks, this.taskForm);
                this.task = cloneDeep(this.task);
                // Patch values to the form from the task
                // this.taskForm.reset({}, {emitEvent: false});
                this.taskForm.patchValue({
                    id       : this.task.id,
                    type     : this.task.type,
                    title    : this.task.title,
                    notes    : this.task.notes,
                    completed: this.task.completed,
                    dueDate  : this.task.dueDate,
                    priority : this.task.priority,
                    tags     :  this.task.tags || [],
                    order    : this.task.order || 0,
                    university: this.task.university || null,
                    course: this.task.course,
                    studentId: this._task.studentId,
                    student: this.task.student,
                    week: this.task.week,
                    mentorAssigned: this.task.mentorAssigned,
                    topic: this.task.topic,
                    discussion: this.task.discussion,
                    reply: this.task.reply
                }, {emitEvent: false});
                setTimeout(() => {
                    this.taskForm.controls.title.setValue(`null`, {emitEvent: false})
                    this._changeDetectorRef.detectChanges(); // Manually trigger change detection
                }, 0);
                setTimeout(() => {
                    this.taskForm.controls.title.setValue(`${this.task.title}`, {emitEvent: false})
                    this._changeDetectorRef.detectChanges(); // Manually trigger change detection
                }, 0);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Update task when there is a value change on the task form
        this.taskForm.valueChanges
            .pipe(
                tap((value) =>
                {
                    // Update the task object
                    this.task = assign(this.task, value);
                    console.log(this.task, value);
                }),
                debounceTime(300),
                takeUntil(this._unsubscribeAll),
            )
            .subscribe((value) =>
            {
                // Update the task on the server
                // this._tasksService.updateTask(value.id, value).subscribe();

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for NavigationEnd event to focus on the title field
        this._router.events
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter(event => event instanceof NavigationEnd),
            )
            .subscribe(() =>
            {
                // Focus on the title field
                this._titleField.nativeElement.focus();
            });

    }

    get f() {
        return this.taskForm.controls;
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        // Listen for matDrawer opened change
        this._tasksListComponent.matDrawer.openedChange
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter(opened => opened),
            )
            .subscribe(() =>
            {
                // Focus on the title element
                this._titleField.nativeElement.focus();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        // Dispose the overlay
        if ( this._tagsPanelOverlayRef )
        {
            this._tagsPanelOverlayRef.dispose();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Close the drawer
     */
    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this._tasksListComponent.matDrawer.close();
    }

    /**
     * Toggle the completed status
     */
    toggleCompleted(): void
    {
        // Get the form control for 'completed'
        const completedFormControl = this.taskForm.get('completed');

        // Toggle the completed status
        completedFormControl.setValue(!completedFormControl.value);
        this.createTask();
    }

    /**
     * Open tags panel
     */
    openTagsPanel(): void
    {
        // Create the overlay
        this._tagsPanelOverlayRef = this._overlay.create({
            backdropClass   : '',
            hasBackdrop     : true,
            scrollStrategy  : this._overlay.scrollStrategies.block(),
            positionStrategy: this._overlay.position()
                .flexibleConnectedTo(this._tagsPanelOrigin.nativeElement)
                .withFlexibleDimensions(true)
                .withViewportMargin(64)
                .withLockedPosition(true)
                .withPositions([
                    {
                        originX : 'start',
                        originY : 'bottom',
                        overlayX: 'start',
                        overlayY: 'top',
                    },
                ]),
        });

        // Subscribe to the attachments observable
        this._tagsPanelOverlayRef.attachments().subscribe(() =>
        {
            // Focus to the search input once the overlay has been attached
            this._tagsPanelOverlayRef.overlayElement.querySelector('input').focus();
        });

        // Create a portal from the template
        const templatePortal = new TemplatePortal(this._tagsPanel, this._viewContainerRef);

        // Attach the portal to the overlay
        this._tagsPanelOverlayRef.attach(templatePortal);

        // Subscribe to the backdrop click
        this._tagsPanelOverlayRef.backdropClick().subscribe(() =>
        {
            // If overlay exists and attached...
            if ( this._tagsPanelOverlayRef && this._tagsPanelOverlayRef.hasAttached() )
            {
                // Detach it
                this._tagsPanelOverlayRef.detach();

                // Reset the tag filter
                this.filteredTags = this.tags;

                // Toggle the edit mode off
                this.tagsEditMode = false;
            }

            // If template portal exists and attached...
            if ( templatePortal && templatePortal.isAttached )
            {
                // Detach it
                templatePortal.detach();
            }
        });
    }

    /**
     * Toggle the tags edit mode
     */
    toggleTagsEditMode(): void
    {
        this.tagsEditMode = !this.tagsEditMode;
    }

    /**
     * Filter tags
     *
     * @param event
     */
    filterTags(event): void
    {
        // Get the value
        const value = event.target.value.toLowerCase();

        // Filter the tags
        this.filteredTags = this.tags.filter(tag => tag.title.toLowerCase().includes(value));
    }

    /**
     * Filter tags input key down event
     *
     * @param event
     */
    filterTagsInputKeyDown(event): void
    {
        // Return if the pressed key is not 'Enter'
        if ( event.key !== 'Enter' )
        {
            return;
        }

        // If there is no tag available...
        if ( this.filteredTags.length === 0 )
        {
            // Create the tag
            this.createTag(event.target.value);

            // Clear the input
            event.target.value = '';

            // Return
            return;
        }

        // If there is a tag...
        const tag = this.filteredTags[0];
        const isTagApplied = this.task.tags.find(id => id === tag.id);

        // If the found tag is already applied to the task...
        if ( isTagApplied )
        {
            // Remove the tag from the task
            this.deleteTagFromTask(tag);
        }
        else
        {
            // Otherwise add the tag to the task
            this.addTagToTask(tag);
        }
    }

    /**
     * Create a new tag
     *
     * @param title
     */
    createTag(title: string): void
    {
        const tag = {
            title,
        };

        // Create tag on the server
        this._tasksService.createTag(tag)
            .subscribe((response) =>
            {
                // Add the tag to the task
                this.addTagToTask(response);
            });
    }

    /**
     * Update the tag title
     *
     * @param tag
     * @param event
     */
    updateTagTitle(tag: Tag, event): void
    {
        // Update the title on the tag
        tag.title = event.target.value;

        // Update the tag on the server
        this._tasksService.updateTag(tag.id, tag)
            .pipe(debounceTime(300))
            .subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Delete the tag
     *
     * @param tag
     */
    deleteTag(tag: Tag): void
    {
        // Delete the tag from the server
        this._tasksService.deleteTag(tag.id).subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Add tag to the task
     *
     * @param tag
     */
    addTagToTask(tag: Tag): void
    {
        // Add the tag
        this.task.tags.unshift(tag.id);

        // Update the task form
        this.taskForm.get('tags').patchValue(this.task.tags);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Delete tag from the task
     *
     * @param tag
     */
    deleteTagFromTask(tag: Tag): void
    {
        // Remove the tag
        this.task.tags.splice(this.task.tags.findIndex(item => item === tag.id), 1);

        // Update the task form
        this.taskForm.get('tags').patchValue(this.task.tags);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Toggle task tag
     *
     * @param tag
     */
    toggleTaskTag(tag: Tag): void
    {
        if ( this.task.tags.includes(tag.id) )
        {
            this.deleteTagFromTask(tag);
        }
        else
        {
            this.addTagToTask(tag);
        }
    }

    /**
     * Should the create tag button be visible
     *
     * @param inputValue
     */
    shouldShowCreateTagButton(inputValue: string): boolean
    {
        console.log(!!!(inputValue === '' || (this.tags || []).findIndex(tag => tag.title.toLowerCase() === inputValue.toLowerCase()) > -1));
        return !!!(inputValue === '' || (this.tags || []).findIndex(tag => tag.title.toLowerCase() === inputValue.toLowerCase()) > -1);
    }

    /**
     * Set the task priority
     *
     * @param priority
     */
    setTaskPriority(priority): void
    {
        // Set the value
        this.taskForm.get('priority').setValue(priority);
    }

    /**
     * Check if the task is overdue or not
     */
    isOverdue(): boolean
    {
        return DateTime.fromISO(this.task.dueDate).startOf('day') < DateTime.now().startOf('day');
    }

    /**
     * Delete the task
     */
    deleteTask(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete task',
            message: 'Are you sure you want to delete this task? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) =>
        {
            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {
                // Get the current task's id
                const id = this.task.id;

                // Get the next/previous task's id
                const currentTaskIndex = this.tasks.findIndex(item => item.id === id);
                const nextTaskIndex = currentTaskIndex + ((currentTaskIndex === (this.tasks.length - 1)) ? -1 : 1);
                const nextTaskId = (this.tasks.length === 1 && this.tasks[0].id === id) ? null : this.tasks[nextTaskIndex].id;

                // Delete the task
                this._tasksService.deleteTask(id)
                    .subscribe((isDeleted) =>
                    {
                        // Return if the task wasn't deleted...
                        if ( !isDeleted )
                        {
                            return;
                        }

                        // // Navigate to the next task if available
                        // if ( nextTaskId )
                        // {
                        //     this._router.navigate(['../', nextTaskId], {relativeTo: this._activatedRoute});
                        // }
                        // // Otherwise, navigate to the parent
                        // else
                        // {
                        //     this._router.navigate(['../'], {relativeTo: this._activatedRoute});
                        // }
                    });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    createTask(){
        let status = TaskStatus.NOT_STARTED;
        const topics = this.tasks.filter(task => task.type !== "section");
        if (this.task.completed) {
            status = TaskStatus.COMPLETED;
        } else {
            if (topics?.length && topics?.some(topic => topic.completed) && topics?.some(topic => !topic.completed)) {
                status = TaskStatus.IN_PROGRESS;
            }
        }
        if (this.task.type === "section" && !this.task.saved) { // If creating a new main task
            this._task = this.task;
        }
        const task: any = { 

            studentId: this._task.studentId,
            student: this._task.student,
            course: this._task.course,
            university: this._task.university,

            title: this.task.title,
            week: this.task.week,
            topics: topics, // Form array for topics],
            mentorAssigned: this.task.mentorAssigned,
            status: status,
            tags: this.task.tags,
            dueDate: this.task.dueDate,
            priority: this.task.priority,
            
         }
         if (this.task.type === "task") {
            // For Topics
            task['order'] = this.task.order;
            task['topic'] = this.task.topic;
            task['discussion'] = this.task.discussion;
            task['reply'] = this.task.reply;
            task['task'] = this._task.id;
            delete task.topics;
         }
         if (this.task.saved) { // For Update;
            task["id"] = this.task.id;
         }
         console.log(this.task, task);
        return this.patchFormAndSave(task).pipe(takeUntil(this._unsubscribeAll)).subscribe(task => {
            this.task.saved = true;
            task.saved = true;
            task.completed = task.status === TaskStatus.COMPLETED;
            // Update the task on the server
            this._tasksService.updateTask(this.task.id, task).subscribe();

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    cancel() {
        this.closeDrawer();
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
}
