import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';

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
import { Student } from 'app/models/student.model';
import { StudentApiService } from 'app/core/student/studentapi.Service';
import { User } from 'app/models/user.model';
import { Course } from 'app/models/course.model';
import { CourseApiService } from 'app/core/course/courseapi.service';
import { cloneDeep } from 'lodash';
import { UsersApiService } from 'app/core/users/users.api.service';


@Component({
    selector: 'app-student-create',
    templateUrl: './student-create.component.html',
    styleUrls: ['./student-create.component.scss'],
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatIconModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule]
})
export class StudentCreateComponent implements OnInit, OnDestroy {
    createStudentForm: FormGroup;
    matcher = new SelectErrorStateMatcher();

    roles: string[] = Object.values(Role).sort();
    titles: string[] = Object.values(Title).sort();
    student: Student = new Student();

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    appRoles = Role;
    inputData: any;
    students: any[] = [];
    professors: any[] = [];
    mentors: User[] = [];
    courses: Course[] = [];

    constructor(
        private dialogRef: MatDialogRef<StudentCreateComponent>,
        private formBuilder: FormBuilder,
        private StudentApiService: StudentApiService,
        private courseApiService: CourseApiService,
        private userService: UserService,
        private usersApiService: UsersApiService,
        @Inject(MAT_DIALOG_DATA) data
    ) {
        this.inputData = data;
        this.student = this.inputData;
    }

    ngOnDestroy(): void {
        console.info(`StudentCreateComponent.ngOnDestroy`);
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

        this.primarySubscripton.add(
            this.usersApiService.users.subscribe((data) => {
                this.mentors = cloneDeep(data);
            })
        );

        this.usersApiService.getAllUsers();
        this.courseApiService.getAllcourses(this.student.university);
        this.initializeFormValues();
        
    }

    /** min lenght and same as controls */
    initializeFormValues() {
        this.createStudentForm = this.formBuilder.group(
            {
                studentId: [this.student?.studentId, Validators.required],
                contactNumber: [this.student?.contactNumber],
                courseType: [this.student?.courseType],
                firstName: [this.student?.firstName, Validators.required],
                lastName: [this.student?.lastName, Validators.required],
                personalEmail: [this.student?.personalEmail, [Validators.required, Validators.email]],
                eduEmail: [this.student?.eduEmail, [Validators.email]],
                eduPassword: [this.student?.eduPassword],
                // assignedMentors: [this.student?.assignedMentors], // Assuming it's an array of objects
                // courses: [this.student?.courses], // Assuming it's an array of objects
                university: [this.student?.university, Validators.required],
                active: [true, Validators.required],
                tracking: [this.student?.tracking],
                courses: this.formBuilder.array([])
            }
        );
        // Add initial course field
        this.addCourse(this.student.courses);
    }

    get f() {
        return this.createStudentForm.controls;
    }

    get coursesCtrl() {
        return this.createStudentForm.get('courses') as FormArray;
      }
    
      addCourse(coursesArr?) {
        if (coursesArr?.length) {
            coursesArr.forEach(course => {
                this.coursesCtrl.push(this.formBuilder.group({
                    course: [course.course, Validators.required],
                    assignedMentors: [course.assignedMentors,  Validators.required]
                  }));
            });
            return ;
        }
        this.coursesCtrl.push(this.formBuilder.group({
          course: ['', Validators.required],
          assignedMentors: ['',  Validators.required]
        }));
      }
    
      removeCourse(index: number) {
        this.coursesCtrl.removeAt(index);
      }


    submit(): void {
        console.log(this.createStudentForm)
        if (this.createStudentForm.invalid) {
            console.info('component.submit form invalid');
            return;
        }
        console.log(this,this.student.id);
        if (this.student.id) {
            this.primarySubscripton.add(
                this.StudentApiService.editStudent(this.createStudentForm.value, this.student.id).subscribe(
                    (data) => {
                        console.info(`Updated Student successfully`);
                        this.dialogRef.close({success: true});
                    },
                    (error) => {
                        console.info(`Error updating Student: ${error}`);
                        // this.alertService.error(`Unable to register Student. ${error}`);
                        // this.dialogRef.close(null);
                    }
                )
            );
        } else {
            this.primarySubscripton.add(
                this.StudentApiService.createStudent(this.createStudentForm.value).subscribe(
                    (data) => {
                        console.info(`Saved Student successfully`);
                        this.dialogRef.close({success: true});
                    },
                    (error) => {
                        console.info(`Error saving Student: ${error}`);
                        // this.alertService.error(`Unable to register Student. ${error}`);
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
