import { Component, Input, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'app/core/user/user.service';
import { Subscription } from 'rxjs';
import { cloneDeep } from 'lodash';
import { Role } from 'app/models/role.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { University } from 'app/models/university.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Professor } from 'app/models/professor.model';
import { ProfessorApiService } from 'app/core/professor/professorsapi.service';
import { ProfessorCreateComponent } from '../professor-create/professor-create.component';

@Component({
    selector: 'app-professors',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatSlideToggleModule, DatePipe],
    templateUrl: './professors.component.html',
    styleUrls: ['./professors.component.scss'],
})
export class ProfessorsComponent {
    columns = [
        'title',
        'tracking',
        'edit',
        'active',
    ];
    professors: Professor[] = [];
    appRoles = Role;

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    isLoggedInUserSuperAdmin: boolean;
    @Input() selectedUniversity: University;

    constructor(
        private professorApiService: ProfessorApiService,
        private dialog: MatDialog,
        private userService: UserService
    ) {
        this.primarySubscripton.add(
            this.professorApiService.professors.subscribe((data) => {
                this.professors = cloneDeep(data);
                this.professors.forEach(professor => professor.university = this.selectedUniversity);
            })
        );
    }

    ngOnDestroy(): void {
        this.primarySubscripton.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log(changes);
        if (!changes.selectedUniversity.isFirstChange()) {
            this.professorApiService.getAllprofessors(this.selectedUniversity.id);
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

        this.professorApiService.getAllprofessors(this.selectedUniversity.id);
    }

    createProfessor(professor?: Professor) {
      const newTerm: Professor =  professor ? professor : {...new Professor(), active: true};
      newTerm.university = this.selectedUniversity.id;
      const dialogRef = this.dialog.open(ProfessorCreateComponent, {
          width: '500px',
          height: '100%',
          restoreFocus: false,
          position: {
              top: '0',
              right: '0',
              bottom: '0'
          },
          data: newTerm
      });
      this.primarySubscripton.add(
          dialogRef.afterClosed().subscribe((data) => {
              if (data?.success) {
                this.professorApiService.getAllprofessors(this.selectedUniversity.id);
              }
          })
      );
  }
}
