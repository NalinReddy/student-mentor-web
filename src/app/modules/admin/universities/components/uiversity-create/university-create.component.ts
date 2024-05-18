import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { Subscription } from 'rxjs';
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


@Component({
    selector: 'app-university-create',
    templateUrl: './university-create.component.html',
    styleUrls: ['./university-create.component.scss'],
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatIconModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule]
})
export class UniversityCreateComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChild('phoneNumber') phoneNumberInput: HTMLInputElement;
    createUniversityForm: FormGroup;
    matcher = new SelectErrorStateMatcher();

    roles: string[] = Object.values(Role).sort();
    titles: string[] = Object.values(Title).sort();
    university: University = new University();

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    appRoles = Role;
    inputData: any;
    students: any[] = [];
    courses: any[] = [];
    professors: any[] = [];
    @Input() universityEditData: University = null;

    constructor(
        private dialogRef: MatDialogRef<UniversityCreateComponent>,
        private formBuilder: FormBuilder,
        private universityApiService: UniversityApiService,
        protected userService: UserService,
        @Inject(MAT_DIALOG_DATA) data
    ) {
        this.inputData = data;
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log(changes);
        if (this.universityEditData?.name) {
            this.inputData = this.universityEditData;
            this.initializeFormValues();
        }
    }

    ngOnDestroy(): void {
        console.info(`UniversityCreateComponent.ngOnDestroy`);
        this.primarySubscripton.unsubscribe();
    }

    ngOnInit(): void {
        this.primarySubscripton.add(
            this.userService.user$.subscribe(user => {
                this.isLoggedInUserAdmin = user.role === this.appRoles.Admin;
            })
        );
        this.initializeFormValues();
        
    }

    /** min lenght and same as controls */
    initializeFormValues() {
        this.createUniversityForm = this.formBuilder.group(
            {
                name: [this.university.name, [Validators.required]],
                courses: [this.university.courses],
                professors: [this.university.professors],
                students: [this.university.students],
            }
        );
    }

    get f() {
        return this.createUniversityForm.controls;
    }

    submit(): void {
        console.log(this.createUniversityForm)
        if (this.createUniversityForm.invalid) {
            console.info('component.submit form invalid');
            return;
        }

        this.primarySubscripton.add(
            this.universityApiService.register(this.createUniversityForm.value).subscribe(
                (data) => {
                    console.info(`Saved University successfully`);
                    this.dialogRef.close(null);
                },
                (error) => {
                    console.info(`Error saving University: ${error}`);
                    // this.alertService.error(`Unable to register University. ${error}`);
                    // this.dialogRef.close(null);
                }
            )
        );
    }

    dismiss(): void {
        this.dialogRef.close(null);
    }
}
