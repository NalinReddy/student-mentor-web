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
import { Term } from 'app/models/term.model';
import { TermApiService } from 'app/core/term/termapi.service';
import { TermCreateComponent } from '../term-create/term-create.component';

@Component({
    selector: 'app-terms',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatSlideToggleModule, DatePipe],
    templateUrl: './terms.component.html',
    styleUrls: ['./terms.component.scss'],
})
export class TermsComponent {
    columns = [
        'name',
        'startDate',
        'university',
        'tracking',
        'edit',
        'active',
    ];
    terms: Term[] = [];
    appRoles = Role;

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    isLoggedInUserSuperAdmin: boolean;
    @Input() selectedUniversity: University;

    constructor(
        private termApiService: TermApiService,
        private dialog: MatDialog,
        private userService: UserService
    ) {
        this.primarySubscripton.add(
            this.termApiService.terms.subscribe((data) => {
                this.terms = cloneDeep(data);
                this.terms.forEach(term => term.university = this.selectedUniversity);
            })
        );
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log(changes);
        if (!changes.selectedUniversity.isFirstChange()) {
            this.termApiService.getAllterms(this.selectedUniversity.id);
        }
    }

    ngOnDestroy(): void {
        this.primarySubscripton.unsubscribe();
    }

    ngOnInit(): void {
        this.primarySubscripton.add(
            this.userService.user$.subscribe((user) => {
                this.isLoggedInUserAdmin = user.role === this.appRoles.Admin;
                this.isLoggedInUserSuperAdmin =
                    user.role === this.appRoles.SuperAdmin;
            })
        );

        this.termApiService.getAllterms(this.selectedUniversity.id);
    }

    createTerm(term?: Term) {
      const newTerm: Term =  term ? term : {...new Term(), active: true};
      newTerm.university = this.selectedUniversity.id;
      const dialogRef = this.dialog.open(TermCreateComponent, {
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
                this.termApiService.getAllterms(this.selectedUniversity.id);
              }
          })
      );
  }
}
