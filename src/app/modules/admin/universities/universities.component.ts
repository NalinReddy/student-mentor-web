import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
// import { UserEditComponent } from '@app/user-edit/user-edit.component';
import { MatDialog } from '@angular/material/dialog';
// import { LoggerService } from '@app/_core/logger/logger.service';
import { Subscription } from 'rxjs';
// import { ConfirmDialogComponent } from '@app/_shared/components/confirm-dialog/confirm-dialog.component';
import { Role } from 'app/models/role.model';
import { cloneDeep } from 'lodash';
import { User } from 'app/models/user.model';
import { UserService } from 'app/core/user/user.service';
import { CommonModule, CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { UniversityApiService } from 'app/core/university/universityapi.service';
import { UniversityCreateComponent } from './components/uiversity-create/university-create.component';
import { NoDataFoundComponent } from 'app/layout/common/no-data-found/no-data-found.component';
import { University } from 'app/models/university.model';
import { MatRippleModule } from '@angular/material/core';
import { TranslocoModule } from '@ngneat/transloco';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CoursesComponent } from './components/courses/courses.component';
import { StudentsComponent } from './components/students/students.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { CreateTopicComponent } from '../create-topic/create-topic.component';
import { TeamComponent } from './components/team/team.component';
import { TermsComponent } from './components/terms/terms.component';
import { ProfessorsComponent } from './components/professors/professors.component';
import { UsersApiService } from 'app/core/users/users.api.service';

@Component({
    selector: 'app-universities',
    templateUrl: './universities.component.html',
    styleUrls: ['./universities.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatPaginatorModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule, MatDividerModule, NoDataFoundComponent,
        MatRippleModule, MatTabsModule, MatButtonToggleModule, NgFor, NgIf, NgClass, CurrencyPipe,
        CoursesComponent, StudentsComponent, TasksComponent, TeamComponent, TermsComponent, ProfessorsComponent
    ]
})
export class UniversitiesComponent implements OnInit, OnDestroy {
    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    isLoggedInUserSuperAdmin: boolean;
    appRoles = Role;
    loggedInUserId: string;
    universities: University[] = [];
    loggedInUser: User;
    selectedUniversity: University;
    selectedTabIndex = 0;
    stats: {};

    constructor(private universityApiService: UniversityApiService, private dialog: MatDialog, private userService: UserService, private userApiService: UsersApiService) {
        this.primarySubscripton.add(
            this.universityApiService.universities.subscribe((data) => {
                this.universities = cloneDeep(data);
                if (this.universities?.length) {
                  this.onChangeOfUniversity(this.universities[0]);
                }
            })
        );
        this.primarySubscripton.add(
            this.userApiService.loggedInUserStats.subscribe((data) => {
                this.stats = cloneDeep(data);
            })
        );
    }

    ngOnDestroy(): void {
        this.primarySubscripton.unsubscribe();
    }

    ngOnInit(): void {
        this.primarySubscripton.add(
        this.userService.user$.subscribe(user => {
            this.isLoggedInUserAdmin = user.role === this.appRoles.Admin;
            this.isLoggedInUserSuperAdmin = user.role === this.appRoles.SuperAdmin;
            this.loggedInUserId = user.id;
            this.loggedInUser = user;
        })

        );

        this.userApiService.getLoggedInUserStats();

        this.universityApiService.getAllUniversities();
        
    }

    onChangeOfUniversity(university: University){
      this.selectedUniversity = university;
    }

    /**
     * Opens a dialog to allow editing the selected user.
     * @param user
     */
    // openUserEditDialog(user: User): void {
    //     const dialogRef = this.dialog.open(UserEditComponent, {
    //         data: {...user, isOnlyEditTruckerUser: true},
    //         width: '500px',
    //         restoreFocus: false,
    //         position: {
    //             top: '0',
    //             right: '0'
    //         }
    //     });
    //     this.primarySubscripton.add(
    //         dialogRef.afterClosed().subscribe((result) => {
    //             this.logger.info(`the dialog was closed ${JSON.stringify(result)}`);
    //             window.scrollTo({
    //                 top: 0,
    //                 left: 0,
    //                 behavior: 'smooth'
    //             });
    //         })
    //     );
    // }

    /**
     * Deletes the specified user
     * @param userId the user id of user to delete
     */
    // _deleteUser(user: User) {
    //     const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    //         data: {
    //             title: 'Delete User',
    //             subHeading: `Name: ${user.firstName} ${user.lastName}`,
    //             message: 'Are you sure you want to delete this user?'
    //         }
    //     });

    //     this.primarySubscripton.add(
    //         dialogRef.afterClosed().subscribe((result) => {
    //             this.logger.info(`The dialog was closed result: ${result}`);
    //             if (result === true) {
    //                 // this.adminService.deleteUser(user.id);
    //             }
    //         })
    //     );
    // }

        /**
     * Activate/Deactivate the specified user
     * @param userId the user id of user to activate/deactivate
     */
        // _toggleActivateUser(event, user: User) {
        //     const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        //         data: {
        //             title: `${event.checked ? 'Activate' : 'Deactivate'} User`,
        //             subHeading: `Name: ${user.firstName} ${user.lastName}`,
        //             message: `Are you sure you want to ${event.checked ? 'activate' : 'deactivate'} this user?`
        //         }
        //     });
    
        //     this.primarySubscripton.add(
        //         dialogRef.afterClosed().subscribe((result) => {
        //             this.logger.info(`The dialog was closed result: ${result}`);
        //             if (result === true) {
        //                 // this.adminService.toggleActivateUser(user.id, event.checked);
        //             } else {
        //                 event.source.checked = !event.checked;
        //             }
        //         })
        //     );
        // }

        createUniversity() {
            const dialogRef = this.dialog.open(UniversityCreateComponent, {
                width: '500px',
                height: '100%',
                restoreFocus: false,
                position: {
                    top: '0',
                    right: '0',
                    bottom: '0'
                }
            });
            this.primarySubscripton.add(
                dialogRef.afterClosed().subscribe((data) => {
                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: 'smooth'
                    });
                })
            );
        }

        createTopic() {
            const dialogRef = this.dialog.open(CreateTopicComponent, {
                width: '500px',
                height: '100%',
                restoreFocus: false,
                position: {
                    top: '0',
                    right: '0',
                    bottom: '0'
                }
            });
            this.primarySubscripton.add(
                dialogRef.afterClosed().subscribe((data) => {
                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: 'smooth'
                    });
                })
            );
        }
        
}
