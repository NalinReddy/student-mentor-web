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


@Component({
    selector: 'app-member-create',
    templateUrl: './member-create.component.html',
    styleUrls: ['./member-create.component.scss'],
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatIconModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule]
})
export class MemberCreateComponent implements OnInit, OnDestroy {
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
        private dialogRef: MatDialogRef<MemberCreateComponent>,
        private formBuilder: FormBuilder,
        private usersApiService: UsersApiService,
        protected userService: UserService,
        @Inject(MAT_DIALOG_DATA) data
    ) {
        this.user.phones = [new Phone()];
        this.inputData = data;
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
                title: [this.inputData?.user?.title, [Validators.required]],
                firstName: [this.inputData?.user?.firstName, [Validators.required]],
                lastName: [this.inputData?.user?.lastName, [Validators.required]],
                email: [this.inputData?.user?.email, [Validators.email, Validators.required]],
                // password: [this.inputData?.user?.password, [Validators.required, Validators.minLength(6)]],
                // confirmPassword: [this.inputData?.user?.confirmPassword, [Validators.required, Validators.minLength(6)]],
                // acceptTerms: [this.inputData?.user?.acceptTerms, [Validators.requiredTrue]],
                phones: [this.inputData?.user?.phones?.length ? this.inputData?.user?.phones[0].number : '', [Validators.pattern('^[0-9-]*$')]],
                role: [Role.Member, [Validators.required]],
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
        this.primarySubscripton.add(
            this.usersApiService.createMember(this.createUserForm.value, this.inputData.mentorId).subscribe(
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

    dismiss(): void {
        this.dialogRef.close(null);
    }
}
