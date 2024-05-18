import { Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'app/core/user/user.service';
import { Subscription } from 'rxjs';
import { cloneDeep } from 'lodash';
import { Role } from 'app/models/role.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { University } from 'app/models/university.model';
import { Student } from 'app/models/student.model';
import { StudentApiService } from 'app/core/student/studentapi.Service';
import { StudentCreateComponent } from '../student-create/student-create.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { StudentDetailsSettingsComponent } from './student-details-settings/student-details-settings.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CourseApiService } from 'app/core/course/courseapi.service';
import { ProfessorApiService } from 'app/core/professor/professorsapi.service';
import { courses } from 'app/mock-api/apps/academy/data';
import { Professor } from 'app/models/professor.model';
import { Course, CourseType } from 'app/models/course.model';
import { TermApiService } from 'app/core/term/termapi.service';
import { Term } from 'app/models/term.model';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'app-students',
    standalone: true,
    imports: [CommonModule, MatTableModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatInputModule, MatSelectModule, MatFormFieldModule],
    templateUrl: './students.component.html',
    styleUrls: ['./students.component.scss'],
})
export class StudentsComponent {
    columns = [
        'details',
        'studentId',
        'firstName',
        // 'lastName',
        'university',
        'eduEmail',
        'eduPassword',
        'personalEmail',
        'contactNumber',
        // 'assignedMentors',
        // 'courses',
        // 'tracking',
        'edit',
        'active',
    ];
    students: Student[] = [];
    appRoles = Role;

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    isLoggedInUserSuperAdmin: boolean;
    @Input() selectedUniversity: University;
    filterStudentsForm: any;
    professors: Professor[];
    courses: Course[];
    terms: Term[];
    termPeriods
    courseTypes: CourseType[];

    constructor(
        private studentApiService: StudentApiService,
        private dialog: MatDialog,
        private userService: UserService,
        private fb: FormBuilder,
        private professorApiService: ProfessorApiService,
        private courseApiService: CourseApiService,
        private termApiService: TermApiService,
    ) {
        this.primarySubscripton.add(
            this.studentApiService.students.subscribe((data) => {
                this.students = cloneDeep(data);
                this.students.forEach(course => course.university = this.selectedUniversity);
            })
        );
        this.courseTypes = Object.values(CourseType);
    }

    openDetails(student: Student) {
        const dialogRef = this.dialog.open(StudentDetailsSettingsComponent, {
            width: '100vw',
            maxWidth: '100vw',
            height: '100%',
            restoreFocus: false,
            position: {
                top: '0',
                right: '0',
                bottom: '0'
            },
            data: {student}
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

    ngOnDestroy(): void {
        this.primarySubscripton.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log(changes);
        if (!changes.selectedUniversity.isFirstChange()) {
            this.studentApiService.getAllStudents(this.selectedUniversity.id);
        }
    }

    ngOnInit(): void {
        this.primarySubscripton.add(
            this.userService.user$.subscribe((user) => {
                this.isLoggedInUserAdmin = user.role === this.appRoles.Admin;
                this.isLoggedInUserSuperAdmin =
                    user.role === this.appRoles.SuperAdmin;
                    if (!this.isLoggedInUserAdmin && !this.isLoggedInUserSuperAdmin) {
                        this.columns = this.columns.filter(
                            (column) =>
                                column !== 'details' &&
                                column !== 'active' &&
                                column !== 'edit' &&
                                column !== 'password' &&
                                column !== 'personalEmail' &&
                                column !== 'contactNumber' &&
                                column !== 'eduPassword'
                        );
                    }
            })
        );

        this.studentApiService.getAllStudents(this.selectedUniversity.id);

        // Filter Form
        this.filterStudentsForm = this.fb.group(
            {
                searchText: [''],
                professor: [''],
                course: [''],
                term: [],
                termPeriod: [],
                university: this.selectedUniversity.id
            }
        );

        this.primarySubscripton.add(
            this.professorApiService.professors.subscribe((data) => {
                this.professors = cloneDeep(data);
                this.professors.forEach(professor => professor.university = this.selectedUniversity);
            })
        );
        this.professorApiService.getAllprofessors(this.selectedUniversity.id);
        
        this.primarySubscripton.add(
            this.courseApiService.courses.subscribe((data) => {
                this.courses = cloneDeep(data);
                this.professors.forEach(professor => professor.university = this.selectedUniversity);
            })
        );
        this.courseApiService.getAllcourses(this.selectedUniversity?.id);

        this.primarySubscripton.add(
            this.termApiService.terms.subscribe((data) => {
                this.terms = cloneDeep(data);
                this.terms.forEach(term => term.university = this.selectedUniversity);
            })
        );
        this.termApiService.getAllterms(this.selectedUniversity.id);

        this.primarySubscripton.add(
        this.filterStudentsForm.valueChanges.subscribe(v => {
            this.studentApiService.deepSearchStudents(v);
        })
        );
    }

    createStudent(student?: Student) {
      const newStudent = student ? student : new Student();
      newStudent.university = this.selectedUniversity.id;
      console.log(student);
      const dialogRef = this.dialog.open(StudentCreateComponent, {
          width: '500px',
          height: '100%',
          restoreFocus: false,
          position: {
              top: '0',
              right: '0',
              bottom: '0'
          },
          data: newStudent
      });
      this.primarySubscripton.add(
          dialogRef.afterClosed().subscribe((data) => {
              if (data?.success) {
                this.studentApiService.getAllStudents(this.selectedUniversity.id);
              }
          })
      );
  }
}
