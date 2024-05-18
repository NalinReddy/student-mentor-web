import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPreview, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { DatePipe, DOCUMENT, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { filter, fromEvent, Subject, takeUntil } from 'rxjs';
import { Tag, Task } from '../tasks.types';
import { TasksService } from '../tasks.service';
import { TasksDetailsComponent } from '../details/details.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TaskStatus } from 'app/models/task.model';

@Component({
    selector       : 'tasks-list',
    templateUrl    : './list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [MatSidenavModule, RouterOutlet, NgIf, MatButtonModule, MatTooltipModule, MatIconModule, CdkDropList, NgFor, CdkDrag, NgClass, CdkDragPreview, CdkDragHandle, RouterLink, TitleCasePipe, DatePipe, TasksDetailsComponent],
})
export class TasksListComponent implements OnInit, OnDestroy
{
    @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    drawerMode: 'side' | 'over';
    selectedTask: Task;
    tags: Tag[];
    tasks: Task[];
    tasksCount: any = {
        completed : 0,
        incomplete: 0,
        total     : 0,
    };
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    _DBTask: any;
    enableAddTopic: boolean;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
        private _tasksService: TasksService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dialogRef: MatDialogRef<TasksListComponent>,
    )
    {
        if (this.data.task) {
            this._DBTask = this.data.task;
            this._tasksService.clearTasks().subscribe(d => {
                // If already saved task is being presumed or viewed... Add that task and also it's topics
                if (this._DBTask.id && this._DBTask.saved) { 
                    this._DBTask.type = "section";
                    this._changeDetectorRef.markForCheck();
                    const tasksInFlat = [];
                    this._DBTask.saved = true;
                    this._DBTask.completed = this._DBTask.status === TaskStatus.COMPLETED;
                    tasksInFlat.push(this._DBTask);
                    if (this._DBTask.topics?.length) {
                        this._DBTask.topics.forEach((topic) => {
                            topic.type = 'task';
                            topic.saved = true;
                            topic.completed =
                                topic.status === TaskStatus.COMPLETED;
                            tasksInFlat.push(topic);
                        });
                    }
                    this._tasksService.createTaskInBulk(tasksInFlat).subscribe(newTask => {
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    });
                }
            });
        } 
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Get the tags
        this._tasksService.tags$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tags: Tag[]) =>
            {
                this.tags = tags;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the tasks
        this._tasksService.tasks$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((tasks: Task[]) =>
            {
                this.tasks = tasks || [];

                // Update the counts
                this.tasksCount.total = this.tasks.filter(task => task.type === 'task').length;
                this.tasksCount.completed = this.tasks.filter(task => task.type === 'task' && task.completed).length;
                this.tasksCount.incomplete = this.tasksCount.total - this.tasksCount.completed;
                this.enableAddTopic = this.tasks.some(task => task.type === "section" && task.saved);
                console.log(this.tasks, this.enableAddTopic);


                // Mark for check
                this._changeDetectorRef.markForCheck();

                // // Update the count on the navigation
                // setTimeout(() =>
                // {
                //     // Get the component -> navigation data -> item
                //     const mainNavigationComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');

                //     // If the main navigation component exists...
                //     if ( mainNavigationComponent )
                //     {
                //         const mainNavigation = mainNavigationComponent.navigation;
                //         const menuItem = this._fuseNavigationService.getItem('apps.tasks', mainNavigation);

                //         // Update the subtitle of the item
                //         menuItem.subtitle = this.tasksCount.incomplete + ' remaining tasks';

                //         // Refresh the navigation
                //         mainNavigationComponent.refresh();
                //     }
                // });
            });

        // Get the task
        this._tasksService.task$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((task: Task) =>
            {
                this.selectedTask = task;
                console.log(this.selectedTask);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to media query change
        this._fuseMediaWatcherService.onMediaQueryChange$('(min-width: 1440px)')
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((state) =>
            {
                // Calculate the drawer mode
                this.drawerMode = state.matches ? 'side' : 'over';

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for shortcuts
        fromEvent(this._document, 'keydown')
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter<KeyboardEvent>(event =>
                    (event.ctrlKey === true || event.metaKey) // Ctrl or Cmd
                    && (event.key === '/' || event.key === '.'), // '/' or '.' key
                ),
            )
            .subscribe((event: KeyboardEvent) =>
            {
                // If the '/' pressed
                if ( event.key === '/' )
                {
                    this.createTask('task');
                }

                // If the '.' pressed
                if ( event.key === '.' )
                {
                    this.createTask('section');
                }
            });
    }

    openTaskDetails(task: Task) {
        console.log(task);
        this._tasksService.getTaskById(task.id).subscribe();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
        this._tasksService.clearSelectedTask();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Go back to the list
        // this._router.navigate(['./'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Create task
     *
     * @param type
     */
    createTask(type: 'task' | 'section'): void
    {
        const params = {
            university: this._DBTask.university, 
            course: this._DBTask.course, 
            mentorAssigned: this._DBTask.mentorAssigned, 
            week: this._DBTask.week,
            studentId: this._DBTask.studentId,
            student: this._DBTask.student,
        }
        // Create the task
        this._tasksService.createTask(type, params).subscribe((newTask) =>
        {
            // Go to the new task
            // this._router.navigate(['./', newTask.id], {relativeTo: this._activatedRoute});

            // Mark for check
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Toggle the completed status
     * of the given task
     *
     * @param task
     */
    toggleCompleted(task: Task): void
    {
        // Toggle the completed status
        task.completed = !task.completed;

        // Update the task on the server
        this._tasksService.updateTask(task.id, task).subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Task dropped
     *
     * @param event
     */
    dropped(event: CdkDragDrop<Task[]>): void
    {
        // Move the item in the array
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

        // Save the new order
        this._tasksService.updateTasksOrders(event.container.data).subscribe();

        // Mark for check
        this._changeDetectorRef.markForCheck();
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

    closeDialog() {

        this.dialogRef.close();
    }
}
