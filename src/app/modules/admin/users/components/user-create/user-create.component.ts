import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { combineLatest, Observable, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SelectErrorStateMatcher } from '@fuse/directives/error-state-matcher';
import { Role } from 'app/models/role.model';
import { Title } from 'app/models/title.model';
import { User } from 'app/models/user.model';
import { UsersApiService } from 'app/core/users/users.api.service';
import { Phone } from 'app/models/phone.model';
import { UserService } from 'app/core/user/user.service';
import { MustMatch } from '@fuse/directives/must-match.validator';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

declare var gtag;

@Component({
    selector: 'app-user-create',
    templateUrl: './user-create.component.html',
    styleUrls: ['./user-create.component.scss'],
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatIconModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule]
})
export class UserCreateComponent implements OnInit, OnDestroy {
    @ViewChild('phoneNumber') phoneNumberInput: HTMLInputElement;
    createUserForm: FormGroup;
    matcher = new SelectErrorStateMatcher();

    roles: string[] = Object.values(Role).sort();
    titles: string[] = Object.values(Title).sort();
    user: User = new User();

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    appRoles = Role;
    inputData: any;

    constructor(
        private dialogRef: MatDialogRef<UserCreateComponent>,
        private formBuilder: FormBuilder,
        private usersApiService: UsersApiService,
        protected userService: UserService,
        @Inject(MAT_DIALOG_DATA) data
    ) {
        this.user.phones = [new Phone()];
        this.inputData = data;
        if (this.inputData.user?.id) {
            this.user = this.inputData.user;
        }
    }

    ngOnDestroy(): void {
        console.info(`UserCreateComponent.ngOnDestroy`);
        this.primarySubscripton.unsubscribe();
    }

    ngOnInit(): void {
        this.primarySubscripton.add(
            this.userService.user$.subscribe(user => {
                this.isLoggedInUserAdmin = user.role === this.appRoles.Admin;
                if (user.role !== this.appRoles.SuperAdmin) {
                    // this.roles = this.roles.filter(role => role !== this.appRoles.SuperAdmin);
                }
            })
        );
        this.initializeFormValues();
        
    }

    /** min lenght and same as controls */
    initializeFormValues() {
        this.createUserForm = this.formBuilder.group(
            {
                title: [this.user.title, [Validators.required]],
                firstName: [this.user.firstName, [Validators.required]],
                lastName: [this.user.lastName, [Validators.required]],
                email: [this.user.email, [Validators.email, Validators.required]],
                password: [this.user.password, [Validators.required, Validators.minLength(6)]],
                confirmPassword: [this.user.confirmPassword, [Validators.required, Validators.minLength(6)]],
                acceptTerms: [this.user.acceptTerms, [Validators.requiredTrue]],
                phones: [this.user.phones[0].number, [Validators.pattern('^[0-9-]*$')]],
                role: [this.user.role, [Validators.required]],
            },
            {
                validator: MustMatch('password', 'confirmPassword')
            }
        );
        console.log(this.createUserForm, this.createUserForm.getRawValue())
    }

    customerObjectComparisonFunction(option, value): boolean {
        return option.id === value.id;
    }

    get f() {
        return this.createUserForm.controls;
    }

    submit(): void {
        if (this.createUserForm.invalid) {
            console.info('user.create.component.submit form invalid');
            return;
        }

        const userToRegister = this.createUserForm.value;

        if (userToRegister.phones !== undefined) {
            console.info('user.create.component.submit user has phones');
            userToRegister.phones = [
                {
                    type: 'mobile',
                    usage: 'work',
                    number: userToRegister.phones,
                    primary: true
                }
            ];
        }
        if (this.inputData?.user?.id) {
            this.primarySubscripton.add(
                this.usersApiService.editUser(this.createUserForm.value, this.inputData?.user?.id).subscribe(
                    (data) => {
                        console.info(`Updated user successfully`);
                        this.dialogRef.close(null);
                    },
                    (error) => {
                        console.info(`Error saving user: ${error}`);
                        // this.alertService.error(`Unable to register user. ${error}`);
                        // this.dialogRef.close(null);
                    }
                )
            );
        } else {
            this.primarySubscripton.add(
                this.usersApiService.register(this.createUserForm.value).subscribe(
                    (data) => {
                        console.info(`Saved user successfully`);
                        this.dialogRef.close(null);
                    },
                    (error) => {
                        console.info(`Error saving user: ${error}`);
                        // this.alertService.error(`Unable to register user. ${error}`);
                        // this.dialogRef.close(null);
                    }
                )
            );
        }
    }

    dismiss(): void {
        this.dialogRef.close(null);
    }
}
