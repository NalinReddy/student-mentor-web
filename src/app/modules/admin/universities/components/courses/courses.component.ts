import { Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { Course } from 'app/models/course.model';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'app/core/user/user.service';
import { Subscription } from 'rxjs';
import { CourseApiService } from 'app/core/course/courseapi.service';
import { cloneDeep } from 'lodash';
import { Role } from 'app/models/role.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CourseCreateComponent } from '../course-create/course-create.component';
import { University } from 'app/models/university.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Term } from 'app/models/term.model';
import { Professor } from 'app/models/professor.model';

@Component({
    selector: 'app-courses',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatSlideToggleModule],
    templateUrl: './courses.component.html',
    styleUrls: ['./courses.component.scss'],
})
export class CoursesComponent {
    columns = [
        'name',
        'term',
        'termPeriod',
        'professor',
        'university',
        'price',
        'tracking',
        'edit',
        'active',
    ];
    courses: Course[] = [];
    appRoles = Role;

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    isLoggedInUserSuperAdmin: boolean;
    @Input() selectedUniversity: University;

    constructor(
        private courseApiService: CourseApiService,
        private dialog: MatDialog,
        private userService: UserService
    ) {
        this.primarySubscripton.add(
            this.courseApiService.courses.subscribe((data) => {
                this.courses = cloneDeep(data);
                this.courses.forEach(course => course.university = this.selectedUniversity);
            })
        );
    }

    ngOnDestroy(): void {
        this.primarySubscripton.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log(changes);
        if (!changes.selectedUniversity.isFirstChange()) {
            this.courseApiService.getAllcourses(this.selectedUniversity.id);
        }
    }

    ngOnInit(): void {
        this.primarySubscripton.add(
            this.userService.user$.subscribe((user) => {
                this.isLoggedInUserAdmin = user.role === this.appRoles.Admin;
                this.isLoggedInUserSuperAdmin =
                    user.role === this.appRoles.SuperAdmin;
            })
        );

        this.courseApiService.getAllcourses(this.selectedUniversity.id);
    }

    createCourse(course?: Course) {
      const newCourse: Course = course?.id ? {...course} : {...new Course(), active: true};
      newCourse.university = this.selectedUniversity.id;
      newCourse.term = course?.id ? (course.term as Term)?.id : null; 
      newCourse.professor = (course?.professor as Professor)?.id ? (course?.professor as Professor).id : null;
      const dialogRef = this.dialog.open(CourseCreateComponent, {
          width: '500px',
          height: '100%',
          restoreFocus: false,
          position: {
              top: '0',
              right: '0',
              bottom: '0'
          },
          data: newCourse
      });
      this.primarySubscripton.add(
          dialogRef.afterClosed().subscribe((data) => {
              if (data?.success) {
                this.courseApiService.getAllcourses(this.selectedUniversity.id);
              }
          })
      );
  }
}
