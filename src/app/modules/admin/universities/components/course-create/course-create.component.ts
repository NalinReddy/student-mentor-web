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
import { Course, CourseType } from 'app/models/course.model';
import { CourseApiService } from 'app/core/course/courseapi.service';
import { TermApiService } from 'app/core/term/termapi.service';
import { Term } from 'app/models/term.model';
import { ProfessorApiService } from 'app/core/professor/professorsapi.service';


@Component({
    selector: 'app-course-create',
    templateUrl: './course-create.component.html',
    styleUrls: ['./course-create.component.scss'],
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatIconModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule]
})
export class CourseCreateComponent implements OnInit, OnDestroy {
    createCourseForm: FormGroup;
    matcher = new SelectErrorStateMatcher();

    roles: string[] = Object.values(Role).sort();
    titles: string[] = Object.values(Title).sort();
    course: Course = new Course();
    courseTypes = [];
    CourseTypeEnum = CourseType;

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    appRoles = Role;
    inputData: any;
    students: any[] = [];
    professors: any[] = [];
    selectedTermType: CourseType;
    availableWeeks: any[];
    terms: Term[];

    constructor(
        private dialogRef: MatDialogRef<CourseCreateComponent>,
        private formBuilder: FormBuilder,
        private courseApiService: CourseApiService,
        private professorApiService: ProfessorApiService,
        private termApiService: TermApiService,
        protected userService: UserService,
        @Inject(MAT_DIALOG_DATA) data
    ) {
        this.inputData = data;
        this.course = this.inputData;
        console.log(this.course);
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
            this.termApiService.terms.subscribe(terms => this.terms = terms)
        );
        this.termApiService.getAllterms(this.course.university);

        this.primarySubscripton.add(
            this.professorApiService.professors.subscribe(professors => this.professors = professors)
        );
        this.professorApiService.getAllprofessors(this.course.university);
        this.initializeFormValues();
        
    }

    /** min lenght and same as controls */
    initializeFormValues() {
        this.createCourseForm = this.formBuilder.group(
            {
                name: [this.course?.name, Validators.required],
                term: [this.course?.term, Validators.required],
                termPeriod: this.formBuilder.group({
                  type: [this.course?.termPeriod?.type, Validators.required],
                  startWeek: [this.course?.termPeriod?.startWeek, Validators.required],
                  endWeek: [this.course?.termPeriod?.endWeek, Validators.required]
                }),
                professor: [this.course?.professor],
                university: [this.course?.university, Validators.required],
                price: [this.course?.price],
                tracking: [this.course?.tracking],
                active: [this.course?.active, Validators.required]
            }
        );
        if (!!this.course?.id && !!this.course.termPeriod?.type) {
            this.onTermTypeChange(this.course.termPeriod.type)
        }
    }

    get f() {
        return this.createCourseForm.controls;
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

    submit(): void {
        console.log(this.createCourseForm)
        if (this.createCourseForm.invalid) {
            console.info('component.submit form invalid');
            return;
        }

        if (this.course.id) {
            this.primarySubscripton.add(
                this.courseApiService.editCourse(this.createCourseForm.value, this.course.id).subscribe(
                    (data) => {
                        console.info(`Updated Course successfully`);
                        this.dialogRef.close({success: true});
                    },
                    (error) => {
                        console.info(`Error updating Course: ${error}`);
                        // this.alertService.error(`Unable to register Course. ${error}`);
                        // this.dialogRef.close(null);
                    }
                )
            );
        } else {

            this.primarySubscripton.add(
                this.courseApiService.createCourse(this.createCourseForm.value).subscribe(
                    (data) => {
                        console.info(`Saved Course successfully`);
                        this.dialogRef.close({success: true});
                    },
                    (error) => {
                        console.info(`Error saving Course: ${error}`);
                        // this.alertService.error(`Unable to register Course. ${error}`);
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
