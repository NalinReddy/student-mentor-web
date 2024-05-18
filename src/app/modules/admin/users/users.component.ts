import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource, MatTableDataSourcePaginator, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
// import { UserEditComponent } from '@app/user-edit/user-edit.component';
import { MatDialog } from '@angular/material/dialog';
// import { LoggerService } from '@app/_core/logger/logger.service';
import { Subscription } from 'rxjs';
// import { ConfirmDialogComponent } from '@app/_shared/components/confirm-dialog/confirm-dialog.component';
import { Role } from 'app/models/role.model';
import { UsersApiService } from 'app/core/users/users.api.service';
import { cloneDeep } from 'lodash';
import { User } from 'app/models/user.model';
import { UserService } from 'app/core/user/user.service';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MemberCreateComponent } from './components/member-create/member-create.component';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatPaginatorModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatMenuModule, MatDividerModule
    ],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', opacity: '0', display: 'none' })),
            // state('expanded', style({ 'height': 'auto', 'opacity': '1' })),
            state('expanded', style({ height: 'auto', opacity: '1', display: 'table-row' })),

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
export class UsersComponent implements OnInit, OnDestroy {
    displayedColumns: string[] = [
        'expand',
        // 'select',
        'email',
        'title',
        'firstName',
        'lastName',
        'customer',
        'phone',
        'role',
        'lastLogin',
        'created',
        'edit',
        'delete'
    ];
    memberColumns: string[] = [
        'email',
        'name',
        'created',
        'edit',
        'delete',
        'add'
    ];
    dataSource = new MatTableDataSource<User>([]);
    memberDataSources: {[mentorId: string]: MatTableDataSource<User, MatTableDataSourcePaginator> } = {};
    selection = new SelectionModel<User>(true, []);
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    isLoggedInUserSuperAdmin: boolean;
    appRoles = Role;
    loggedInUserId: string;
    expandedElement: any;

    constructor(private usersApiService: UsersApiService, private dialog: MatDialog, private userService: UserService) {
        this.primarySubscripton.add(
            this.usersApiService.users.subscribe((data) => {
                this.dataSource.data = cloneDeep(data);
                this.dataSource.data.forEach(data => data.expanded = false);
            })
        );
        this.primarySubscripton.add(
            this.usersApiService.members.subscribe((data) => {
                const users = {};
                Object.keys(data).map(key => {
                    users[key] = new MatTableDataSource(data[key]);
                });
                this.memberDataSources = users;
                console.log(this.memberDataSources);
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
            this.dataSource.paginator = this.paginator;
        })

        );

        this.usersApiService.getAllUsers();
        
    }

    isExpansionDetailRow = (i, row: User) => {
        // Check if the current row is the one that should be expanded
        console.log(row, this.expandedElement === row);
        return row.expanded;
      }

    toggleExpansion(element: User): void {
        this.expandedElement = this.expandedElement === element ? null : element;
        element.expanded = !element.expanded;
        console.log(element, this.expandedElement);
        if (element.expanded) {
            this.usersApiService.getAllMembers(element.id);
        }
      }
 
    /**
     * Whether the number of selected elements matches the total number of rows.
     */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.length;
        return numSelected === numRows;
    }

    /**
     * Selects all rows if they are not all selected; otherwise clear selection.
     */
    masterToggle() {
        this.isAllSelected()
            ? this.selection.clear()
            : this.dataSource.data.forEach((row) => this.selection.select(row));
    }

    /**
     * The label for the checkbox on the passed row
     */
    checkboxLabel(row?: User): string {
        if (!row) {
            return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.firstName + row.lastName}`;
    }

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

        createUser(user?: User) {
            const dialogRef = this.dialog.open(UserCreateComponent, {
                width: '500px',
                height: '100%',
                restoreFocus: false,
                position: {
                    top: '0',
                    right: '0',
                    bottom: '0'
                },
                data: {user}
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

        createMember(mentorId: string, member?: User) {
            const dialogRef = this.dialog.open(MemberCreateComponent, {
                width: '500px',
                height: '100%',
                restoreFocus: false,
                position: {
                    top: '0',
                    right: '0',
                    bottom: '0'
                },
                data: {mentorId, user: member }
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
